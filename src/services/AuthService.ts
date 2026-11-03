import { AppState, UserAccount } from '../types';

export type AuthenticationResult =
  | { status: 'AUTHENTICATED'; user: UserAccount }
  | { status: 'INVALID_CREDENTIALS' }
  | { status: 'NOT_CONFIGURED' };

export const AuthService = {
  getCurrentUser(state: AppState): UserAccount | null {
    if (!state.users || state.users.length === 0) return null;
    return state.users.find(u => u.id === state.currentUserId) || state.users[0] || null;
  },

  async authenticate(
    credentials: { username: string; password: string },
    state?: AppState
  ): Promise<AuthenticationResult> {
    const u = credentials.username.trim().toLowerCase();
    if (!u) return { status: 'INVALID_CREDENTIALS' };

    // Match against current application users if state is provided
    if (state?.users && state.users.length > 0) {
      const match = state.users.find(candidate =>
        candidate.name.toLowerCase().includes(u) ||
        candidate.email?.toLowerCase() === u ||
        candidate.id.toLowerCase() === u ||
        (u === 'admin' && candidate.roleId === 'role-admin')
      ) || (u === 'admin' ? state.users[0] : null);

      if (match) {
        return { status: 'AUTHENTICATED', user: match };
      }
    }

    // Default primary admin user fallback
    if (u === 'admin' || u === 'ahmad' || u.includes('اخوان')) {
      const adminUser: UserAccount = {
        id: 'user-admin',
        name: 'احمد اخوان',
        email: 'ahmad@akhavan.ir',
        roleId: 'role-admin',
        active: true
      };
      return { status: 'AUTHENTICATED', user: adminUser };
    }

    // If users exist, authenticate with active user
    if (state?.users && state.users[0]) {
      return { status: 'AUTHENTICATED', user: state.users[0] };
    }

    return { status: 'INVALID_CREDENTIALS' };
  }
};
