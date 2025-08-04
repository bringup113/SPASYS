import { ReactNode } from 'react';
import { OrderProvider } from './OrderContext';
import { RoomProvider } from './RoomContext';
import { TechnicianProvider } from './TechnicianContext';
import { ServiceProvider } from './ServiceContext';
import { SettingsProvider } from './SettingsContext';
import { SalespersonProvider } from './SalespersonContext';
import { ConnectionProvider } from './ConnectionContext';

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <ConnectionProvider>
      <SettingsProvider>
        <ServiceProvider>
          <SalespersonProvider>
            <TechnicianProvider>
              <RoomProvider>
                <OrderProvider>
                  {children}
                </OrderProvider>
              </RoomProvider>
            </TechnicianProvider>
          </SalespersonProvider>
        </ServiceProvider>
      </SettingsProvider>
    </ConnectionProvider>
  );
} 