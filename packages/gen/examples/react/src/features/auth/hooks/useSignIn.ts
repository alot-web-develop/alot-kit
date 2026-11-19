import { useMutation } from '@tanstack/react-query';
import { signIn } from '@/lib/auth';

const useSignIn = (onSignedIn: () => void) => {
  return useMutation({
    mutationFn: signIn,
    onSuccess: onSignedIn,
  });
};

export { useSignIn };
