import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { ShieldCheck, LogIn, UserPlus, MailCheck } from 'lucide-react-native';
import { Palette } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp, resendConfirmationEmail } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [showResendBtn, setShowResendBtn] = useState(false);

  const handleResend = async () => {
    if (!email.trim()) {
      Alert.alert('Atención', 'Ingresa tu correo para reenviar la confirmación.');
      return;
    }
    setLoading(true);
    const { error } = await resendConfirmationEmail(email);
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Correo enviado', 'Se ha enviado un nuevo enlace de confirmación a tu correo.');
    }
  };

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Por favor ingresa tu correo y contraseña.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setInfoMessage(null);
    setShowResendBtn(false);

    try {
      if (isRegister) {
        const { error, isNeedsConfirmation } = await signUp(email, password, displayName);
        if (error) throw error;
        if (isNeedsConfirmation) {
          setInfoMessage(
            '¡Cuenta creada exitosamente! Revisa tu bandeja de entrada para confirmar tu correo antes de iniciar sesión.'
          );
          setShowResendBtn(true);
          setIsRegister(false);
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message?.toLowerCase().includes('email not confirmed')) {
            setShowResendBtn(true);
            throw new Error(
              'Tu correo aún no ha sido confirmado. Por favor revisa tu bandeja de entrada o solicita un reenvío.'
            );
          }
          throw error;
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error durante la autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <ShieldCheck size={36} color={Palette.forest} />
          </View>

          <Text style={styles.title}>KeepUp Mobile</Text>
          <Text style={styles.subtitle}>
            {isRegister
              ? 'Crea tu cuenta para respaldar y sincronizar con KeepUp Watch'
              : 'Inicia sesión con tu cuenta de KeepUp'}
          </Text>

          {infoMessage && (
            <View style={styles.infoBox}>
              <MailCheck size={20} color={Palette.forest} style={{ marginBottom: 4 }} />
              <Text style={styles.infoText}>{infoMessage}</Text>
            </View>
          )}

          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {showResendBtn && (
            <TouchableOpacity
              style={styles.resendBtn}
              onPress={handleResend}
              disabled={loading}>
              <Text style={styles.resendBtnText}>Reenviar correo de confirmación</Text>
            </TouchableOpacity>
          )}

          {isRegister && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre completo</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Luis Rodríguez"
                placeholderTextColor={Palette.textMuted}
                value={displayName}
                onChangeText={setDisplayName}
                maxLength={255}
              />
            </View>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              placeholder="tu@correo.com"
              placeholderTextColor={Palette.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              maxLength={255}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Palette.textMuted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              maxLength={255}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color={Palette.white} />
            ) : (
              <>
                {isRegister ? <UserPlus size={18} color={Palette.white} /> : <LogIn size={18} color={Palette.white} />}
                <Text style={styles.submitBtnText}>
                  {isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchModeBtn}
            onPress={() => {
              setIsRegister(!isRegister);
              setErrorMessage(null);
            }}>
            <Text style={styles.switchModeText}>
              {isRegister
                ? '¿Ya tienes una cuenta? Inicia sesión'
                : '¿No tienes cuenta? Regístrate aquí'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Palette.cream,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: Palette.white,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Palette.sageLight,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Palette.charcoal,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: Palette.textMuted,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: Palette.dangerLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: Palette.danger,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: Palette.sageLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: Palette.forest,
    fontWeight: '600',
    textAlign: 'center',
  },
  resendBtn: {
    backgroundColor: Palette.sageLight,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  resendBtnText: {
    color: Palette.forest,
    fontWeight: '700',
    fontSize: 13,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.charcoal,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Palette.cream,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Palette.cardBorder,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Palette.charcoal,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Palette.forest,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 10,
  },
  submitBtnText: {
    color: Palette.white,
    fontSize: 15,
    fontWeight: '700',
  },
  switchModeBtn: {
    marginTop: 16,
    alignItems: 'center',
    padding: 6,
  },
  switchModeText: {
    fontSize: 13,
    color: Palette.forest,
    fontWeight: '600',
  },
});

