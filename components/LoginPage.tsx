
import React, { useState } from 'react';
import { seedDatabase } from '../services/seedDatabase';
import { SparklesIcon } from './Shared';

interface LoginPageProps {
  onLogin: (username: string, password: string) => Promise<{success: boolean, error?: string}>;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await onLogin(username, password);
    if (!result.success) {
      setError(result.error || 'Invalid credentials. Please try again.');
    }
    setIsLoading(false);
  };

  const handleSeed = async () => {
    if (!window.confirm("WARNING: This will RESET your database content. Continue?")) {
        return;
    }
    setIsSeeding(true);
    try {
        const log = await seedDatabase();
        alert("Database initialization completed.\n\n" + log);
        console.log(log);
    } catch (e: any) {
        console.error(e);
        alert("Error initializing database: " + e.message);
    } finally {
        setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-3xl font-extrabold text-center text-secondary mb-2">FlowApp</h2>
        <p className="text-center text-gray-600 mb-6">Administrator Sign In</p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <fieldset disabled={isLoading || isSeeding}>
            <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="appearance-none rounded-t-md relative block w-full px-3 py-2 border border-gray-600 bg-secondary placeholder-gray-400 text-white focus:z-10 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-b-md -mt-px relative block w-full px-3 py-2 border border-gray-600 bg-secondary placeholder-gray-400 text-white focus:z-10 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </fieldset>
          
          {error && (
              <div className="bg-red-50 border border-red-200 rounded p-2">
                <p className="text-sm text-red-600 text-center font-medium">{error}</p>
              </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading || isSeeding}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-orange-300"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
         
        <div className="mt-8 border-t pt-6 text-center">
            <button 
                onClick={handleSeed}
                disabled={isLoading || isSeeding}
                className="w-full flex items-center justify-center space-x-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
               <SparklesIcon className="w-4 h-4 text-yellow-500" />
               <span>{isSeeding ? 'Initializing...' : 'Initialize / Reset Database'}</span>
            </button>
        </div>

         <div className="mt-6 text-xs text-gray-500 bg-blue-50 p-4 rounded border border-blue-100 text-left">
            <p className="font-bold text-blue-700 mb-1">Troubleshooting:</p>
            <ul className="list-disc ml-4 space-y-1">
                <li>
                    Ensure <strong>"Email" Provider</strong> is <strong>ENABLED</strong> in Supabase (Auth &gt; Providers).
                </li>
                <li>
                    Ensure <strong>"Confirm Email"</strong> is <strong>DISABLED</strong> in Supabase (Auth &gt; Providers &gt; Email).
                </li>
            </ul>
            <p className="font-bold mt-2">Default Credentials:</p>
            <p>Super Admin: <code>superadmin</code> / <code>password</code></p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
