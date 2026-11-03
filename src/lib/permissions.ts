export type DevicePermissionType = 'LOCATION' | 'CAMERA' | 'MICROPHONE' | 'NOTIFICATIONS';

const isBrowser = (): boolean => typeof window !== 'undefined' && typeof navigator !== 'undefined';

export const requestDevicePermission = async (type: DevicePermissionType): Promise<boolean> => {
  if (!isBrowser()) return false;
  try {
    switch (type) {
      case 'LOCATION': {
        if (!navigator.geolocation) return false;
        return await new Promise<boolean>((resolve) => {
          navigator.geolocation.getCurrentPosition(() => resolve(true), () => resolve(false), { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
        });
      }
      case 'NOTIFICATIONS': {
        if (!('Notification' in window)) return false;
        if (Notification.permission === 'granted') return true;
        if (Notification.permission === 'denied') return false;
        const permission = await Notification.requestPermission();
        return permission === 'granted';
      }
      case 'CAMERA': {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      }
      case 'MICROPHONE': {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return false;
        const stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      }
      default: return false;
    }
  } catch (error) {
    console.error(`[AKHAVAN][PERMISSION_FAILED] ${type}`, error);
    return false;
  }
};

export const requestDevicePermissions = async (permissions: DevicePermissionType[]): Promise<Record<DevicePermissionType, boolean>> => {
  const result: Record<DevicePermissionType, boolean> = { LOCATION: false, CAMERA: false, MICROPHONE: false, NOTIFICATIONS: false };
  for (const permission of permissions) {
    result[permission] = await requestDevicePermission(permission);
  }
  return result;
};
