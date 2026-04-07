import { User } from '../types';

const r = <T>(data: T): Promise<{ data: T }> => Promise.resolve({ data });

const MOCK_USER: User = { id: '1', email: 'admin@oceanx.sa', name: 'Admin', role: 'admin' };

export const authApi = {
  login: (_email: string, _password: string) =>
    r({ token: 'mock-jwt-token', user: MOCK_USER }),
  getMe: () => r(MOCK_USER),
  changePassword: (_current_password: string, _new_password: string) => r({}),
};

