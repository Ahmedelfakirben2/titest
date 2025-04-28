
import { Client } from '@microsoft/microsoft-graph-client';
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
  if (!accessToken || !userPrincipalName) {
    throw new Error('Access token and user principal name are required.');
  }

  // Create a custom TokenCredential using the provided access token
  const credential = new StaticTokenCredential(accessToken);

  // Initialize the Microsoft Graph client using the credential
  const authProvider = new TokenCredentialAuthenticationProvider(credential, {
    scopes: ['https://graph.microsoft.com/.default'], // Default scope for Graph API
  });

  const graphClient = Client.initWithMiddleware({
    authProvider: authProvider,
     // Configure fetch options if needed (e.g., timeouts)
     fetchOptions: { timeout: 15000 } // Example: 15 seconds timeout
  });

  try {
    console.log(`Attempting to fetch managed devices for user: ${userPrincipalName}`);
    // Fetch managed devices for the user. Filter by UPN.
    // Select only necessary fields (id, deviceName, operatingSystem).
    // Order by enrollment date descending to likely get the most recent/primary device first.
    // Limit to top 1 device assuming the most recently enrolled is the primary one.
    // Adjust filtering/ordering logic if needed based on your organization's policies.
    const result = await graphClient
      .api('/users/' + userPrincipalName + '/managedDevices') // Target user's devices
      .select('id,deviceName,operatingSystem') // Request specific properties
      .orderby('enrolledDateTime desc')       // Order by enrollment date
      .top(1)                                  // Get only the most recent one
      .get();

    console.log("Graph API Result:", JSON.stringify(result, null, 2));

    if (result && result.value && result.value.length > 0) {
      const deviceData = result.value[0];
      if (!deviceData.deviceName) {
          console.warn("Device found but missing deviceName (hostname):", deviceData);
          throw new Error("Se encontró un dispositivo pero no tiene un nombre (hostname) asignado.");
      }
      console.log(`Device found: ${deviceData.deviceName} (ID: ${deviceData.id})`);
      return {
        id: deviceData.id,
        hostname: deviceData.deviceName,
        operatingSystem: deviceData.operatingSystem || 'Unknown', // Provide default if OS is missing
      };
    } else {
      // No devices found for the user
      console.warn(`No managed device found for user ${userPrincipalName}`);
      throw new Error(`No managed device found for user ${userPrincipalName}`);
    }
  } catch (error: any) {
     // Log the full error object, stringifying for potentially more detail
    console.error('Microsoft Graph API Error:', error, JSON.stringify(error, Object.getOwnPropertyNames(error)));
    // Improve error handling: Check for specific Graph API error codes/messages
    let errorMessage = 'Failed to fetch device information from Microsoft Intune.';
    if (error.isAxiosError || error.name === 'AbortError' || error.message?.includes('fetch')) {
        errorMessage = `Network error or timeout communicating with Microsoft Graph API: ${error.message}`;
    } else if (error.statusCode === 401 || error.statusCode === 403) {
      errorMessage = `Unauthorized (401/403): Check API permissions or token validity for user ${userPrincipalName}. Detail: ${error.message || ''}`;
    } else if (error.statusCode === 404) {
       errorMessage = `User or device endpoint not found (404) for user ${userPrincipalName}. Detail: ${error.message || ''}`;
    } else if (error.message) {
      // Try to extract more details if available in the error response body
      const graphErrorDetail = error.body ? JSON.parse(error.body)?.error?.message : '';
      errorMessage = `Graph API Error: ${error.message}${graphErrorDetail ? ` - ${graphErrorDetail}` : ''}`;
    }
    // Re-throw a more informative error
    throw new Error(errorMessage);
  }
}
