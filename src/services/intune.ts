
import { Client, GraphError } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import type { TokenCredential, GetTokenOptions, AccessToken } from '@azure/core-auth';

/**
 * Represents a device registered in Microsoft Intune.
 */
export interface Device {
  /**
   * The hostname of the device.
   */
  hostname: string;
  /**
   * The unique ID of the device in Intune/Entra ID.
   */
  id: string;
   /**
   * The operating system of the device.
   */
  operatingSystem: string;
}

// Custom TokenCredential implementation to use the access token from NextAuth session
class StaticTokenCredential implements TokenCredential {
  constructor(private token: string) {}

  async getToken(_scopes: string | string[], _options?: GetTokenOptions): Promise<AccessToken | null> {
    // Return the token obtained from the NextAuth session
    // Note: This doesn't handle token expiration or refresh.
    // The token should be valid when passed to this function.
    // Expiry time is unknown here, setting a placeholder far in the future.
     if (!this.token) {
       console.error("StaticTokenCredential: No token provided.");
       return null;
     }
    // console.log("StaticTokenCredential: Providing token."); // Avoid logging token itself
    return {
      token: this.token,
      expiresOnTimestamp: Date.now() + 3600 * 1000, // Assume 1 hour validity for simplicity
    };
  }
}

/**
 * Asynchronously retrieves the primary device registered to a user in Microsoft Intune via Microsoft Graph.
 *
 * @param accessToken The Microsoft Graph API access token obtained from the user's session.
 * @param userPrincipalName The User Principal Name (email) of the logged-in user.
 * @returns A promise that resolves to a Device object containing the hostname and ID.
 * @throws Throws an error if the API call fails or no device is found.
 */
export async function getDevice(accessToken: string, userPrincipalName: string): Promise<Device> {
  if (!accessToken) {
    console.error("getDevice: Access token is missing.");
    throw new Error('Access token is required.');
  }
   if (!userPrincipalName) {
    console.error("getDevice: User principal name is missing.");
    throw new Error('User principal name is required.');
  }

  // Create a custom TokenCredential using the provided access token
  const credential = new StaticTokenCredential(accessToken);

  // Initialize the Microsoft Graph client using the credential
   // Ensure scopes match exactly what's requested during auth
  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ['https://graph.microsoft.com/.default'], // Or specific scopes like ['DeviceManagementManagedDevices.Read.All', 'User.Read'] if preferred
  });

  const graphClient = Client.initWithMiddleware({
    authProvider: authProvider,
     // Configure fetch options if needed (e.g., timeouts)
     fetchOptions: { timeout: 15000 } // Example: 15 seconds timeout
  });

  const requestUrl = `/users/${userPrincipalName}/managedDevices`;
  console.log(`Attempting Microsoft Graph API call to: ${requestUrl}`);
  console.log(`Query parameters: select=id,deviceName,operatingSystem&orderby=enrolledDateTime desc&top=1`);

  try {
    // Fetch managed devices for the user. Filter by UPN.
    // Select only necessary fields (id, deviceName, operatingSystem).
    // Order by enrollment date descending to likely get the most recent/primary device first.
    // Limit to top 1 device assuming the most recently enrolled is the primary one.
    const result = await graphClient
      .api(requestUrl) // Use the defined request URL
      .select('id,deviceName,operatingSystem') // Request specific properties
      .orderby('enrolledDateTime desc')       // Order by enrollment date
      .top(1)                                  // Get only the most recent one
      .get();

    console.log("Microsoft Graph API call successful.");
    // Check if result and result.value are valid and if value is an array
     if (result && Array.isArray(result.value) && result.value.length > 0) {
      const deviceData = result.value[0];
      // Ensure deviceData is an object and has the required properties
      if (typeof deviceData !== 'object' || deviceData === null) {
          console.warn("Graph API returned invalid device data structure:", deviceData);
          throw new Error("Respuesta inesperada de la API de Microsoft Graph (formato de dispositivo inválido).");
      }

      if (!deviceData.deviceName) {
          console.warn("Device found but missing deviceName (hostname):", deviceData);
          // Consider if this should be an error or if a default/placeholder is acceptable
          throw new Error("Se encontró un dispositivo pero no tiene un nombre (hostname) asignado en Intune.");
      }
      console.log(`Device found: ${deviceData.deviceName} (ID: ${deviceData.id})`);
      return {
        id: deviceData.id,
        hostname: deviceData.deviceName,
        operatingSystem: deviceData.operatingSystem || 'Unknown', // Provide default if OS is missing
      };
    } else {
      // No devices found for the user
      console.warn(`No managed device found for user ${userPrincipalName}. API response value:`, result?.value);
      // Check if the response indicates the user exists but has no devices
      if (result && result.value && result.value.length === 0) {
          throw new Error(`No se encontró ningún dispositivo gestionado asignado al usuario ${userPrincipalName} en Microsoft Intune.`);
      } else {
          // Could be user not found or other issue, provide a generic message
          throw new Error(`No se encontraron dispositivos o la respuesta de la API fue inesperada para el usuario ${userPrincipalName}.`);
      }
    }
  } catch (error: any) {
     // Log the full error object, stringifying for potentially more detail
    console.error('Microsoft Graph API Error caught:', error);

    let errorMessage = 'Failed to fetch device information from Microsoft Intune.';
    let statusCode = error instanceof GraphError ? error.statusCode : undefined;

    // Check for specific error types or messages
    if (error instanceof GraphError) {
        console.error(`GraphError: Status Code: ${error.statusCode}, Code: ${error.code}, Message: ${error.message}`);
        statusCode = error.statusCode; // Ensure statusCode is set
        if (error.statusCode === 401 || error.statusCode === 403) {
            errorMessage = `Unauthorized (${error.statusCode}): Check API permissions (DeviceManagementManagedDevices.Read.All for user ${userPrincipalName}) or token validity. ${error.message}`;
        } else if (error.statusCode === 404) {
            // Check if the error message indicates user not found vs endpoint not found
            if (error.message?.toLowerCase().includes('user') && error.message?.toLowerCase().includes('not found')) {
                errorMessage = `User ${userPrincipalName} not found in directory (404).`;
            } else {
                errorMessage = `Device endpoint or user not found (404). ${error.message}`;
            }
        } else if (error.statusCode === 400) {
            errorMessage = `Bad Request (400): Invalid query or parameter. ${error.message}`;
        } else if (error.statusCode >= 500) {
             errorMessage = `Server Error (${error.statusCode}) from Microsoft Graph API. Try again later. ${error.message}`;
        }
        else {
            errorMessage = `Graph API Error (${error.statusCode}): ${error.message || 'Unknown Graph error'}`;
        }
    } else if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        errorMessage = `Network timeout communicating with Microsoft Graph API. ${error.message}`;
    } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
        // Specific error for network issues like CORS, DNS failure, server unreachable
        errorMessage = `Network error (Failed to fetch). Check internet connection, VPN/proxy settings, or if Microsoft Graph API is temporarily unavailable. ${error.message}`;
    } else {
        // Fallback for other errors
        errorMessage = `Unexpected error fetching device: ${error.message || 'Unknown error occurred'}`;
        // Try to parse body if available and not already a GraphError
        if (!(error instanceof GraphError) && error.body) {
            try {
                const errorBody = JSON.parse(error.body);
                const graphErrorDetail = errorBody?.error?.message;
                if (graphErrorDetail) {
                    errorMessage += ` - API Detail: ${graphErrorDetail}`;
                }
            } catch (parseError) {
                console.warn("Could not parse error body:", parseError);
            }
        }
    }

    // Attach status code if available
    const finalError = new Error(errorMessage);
    if (statusCode) {
        (finalError as any).statusCode = statusCode; // Attach for potential use in UI
    }
    // Re-throw the more informative error
    throw finalError;
  }
}

    