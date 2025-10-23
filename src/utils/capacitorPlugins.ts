import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';
import { PushNotifications } from '@capacitor/push-notifications';
import { NativeBiometric } from 'capacitor-native-biometric';

export const capturePhoto = async () => {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera
    });
    
    return image.dataUrl;
  } catch (error) {
    console.error('Error capturing photo:', error);
    throw error;
  }
};

export const pickDocument = async () => {
  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos
    });
    
    return image.dataUrl;
  } catch (error) {
    console.error('Error picking document:', error);
    throw error;
  }
};

export const getCurrentLocation = async () => {
  try {
    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000
    });
    
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    };
  } catch (error) {
    console.error('Error getting location:', error);
    throw error;
  }
};

export const requestLocationPermission = async () => {
  try {
    const result = await Geolocation.checkPermissions();
    
    if (result.location === 'granted') {
      return true;
    }
    
    const requestResult = await Geolocation.requestPermissions();
    return requestResult.location === 'granted';
  } catch (error) {
    console.error('Error requesting location permission:', error);
    return false;
  }
};

export const initPushNotifications = async (userId: string) => {
  try {
    // Request permission
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      throw new Error('Push notification permission not granted');
    }

    // Register with Apple / Google
    await PushNotifications.register();

    // Listen for registration
    PushNotifications.addListener('registration', async (token) => {
      console.log('Push registration success, token: ' + token.value);
      
      // Save token to Supabase
      const { supabase } = await import('@/integrations/supabase/client');
      await supabase.from('push_tokens').upsert({
        user_id: userId,
        token: token.value,
        platform: 'ios' // or 'android' based on platform
      });
    });

    PushNotifications.addListener('registrationError', (error) => {
      console.error('Error on registration: ' + JSON.stringify(error));
    });

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('Push notification received: ' + JSON.stringify(notification));
    });

    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
      console.log('Push notification action performed', JSON.stringify(notification));
    });

  } catch (error) {
    console.error('Error initializing push notifications:', error);
  }
};

export const authenticateWithBiometrics = async () => {
  try {
    // Check if biometrics are available
    const result = await NativeBiometric.isAvailable();

    if (!result.isAvailable) {
      throw new Error('Biometric authentication not available');
    }

    // Perform authentication
    const verified = await NativeBiometric.verifyIdentity({
      reason: 'For secure access to your account',
      title: 'Biometric Authentication',
      subtitle: 'Please verify your identity',
      description: 'Use your fingerprint or face to authenticate',
    });

    return verified;
  } catch (error) {
    console.error('Biometric authentication error:', error);
    throw error;
  }
};

export const setBiometricCredentials = async (username: string, password: string) => {
  try {
    await NativeBiometric.setCredentials({
      username,
      password,
      server: 'drillity.com',
    });
  } catch (error) {
    console.error('Error setting biometric credentials:', error);
    throw error;
  }
};

export const getBiometricCredentials = async () => {
  try {
    const credentials = await NativeBiometric.getCredentials({
      server: 'drillity.com',
    });
    
    return credentials;
  } catch (error) {
    console.error('Error getting biometric credentials:', error);
    return null;
  }
};
