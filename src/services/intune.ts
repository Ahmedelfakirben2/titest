/**
 * Represents a device registered in Microsoft Intune.
 */
export interface Device {
  /**
   * The hostname of the device.
   */
  hostname: string;
}

/**
 * Asynchronously retrieves the device registered to a user in Microsoft Intune.
 *
 * @param userId The user's ID.
 * @returns A promise that resolves to a Device object containing the hostname.
 */
export async function getDevice(userId: string): Promise<Device> {
  // TODO: Implement this by calling the Microsoft Intune API.

  return {
    hostname: 'DESKTOP-12345'
  };
}
