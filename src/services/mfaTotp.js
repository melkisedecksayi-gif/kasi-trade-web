
export async function getMfaStatus(supabase) {
  const { data, error } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (error) throw error;

  if (data.currentLevel === 'aal2') {
    return 'verified';
  }

  if (data.nextLevel === 'aal2') {
    return 'challenge_required';
  }

  return 'enrollment_required';
}

export async function beginTotpEnrollment(supabase) {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    friendlyName: 'KasiTrade POS',
  });

  if (error) throw error;

  return {
    factorId: data.id,
    qrCode: data.totp.qr_code,
  };
}

export async function verifyTotpCode(
  supabase,
  factorId,
  code
) {
  if (!/^[0-9]{6}$/.test(String(code))) {
    throw new Error('Ingiza OTP yenye tarakimu 6');
  }

  const { error } =
    await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: String(code),
    });

  if (error) throw error;

  const status = await getMfaStatus(supabase);

  if (status !== 'verified') {
    throw new Error('Uthibitishaji haujakamilika');
  }

  return true;
}
