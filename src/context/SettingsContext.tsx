import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Country, CompanyCommissionRule, BusinessSettings, SettingsState } from '../types';
import { countryAPI, companyCommissionRuleAPI } from '../services/api';
import { websocketService } from '../services/websocket';

interface SettingsContextType extends SettingsState {
  addCountry: (country: Omit<Country, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCountry: (id: string, country: Partial<Country>) => void;
  deleteCountry: (id: string) => void;
  addCompanyCommissionRule: (rule: Omit<CompanyCommissionRule, 'id'>) => void;
  updateCompanyCommissionRule: (id: string, rule: Partial<CompanyCommissionRule>) => void;
  deleteCompanyCommissionRule: (id: string) => void;
  updateBusinessSettings: (settings: BusinessSettings) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const initialState: SettingsState = {
  countries: [],
  companyCommissionRules: [],
  businessSettings: undefined,
  isLoading: false,
  error: null,
};

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SettingsState>(initialState);

  // 初始化时加载设置数据
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setState((prev: SettingsState) => ({ ...prev, isLoading: true, error: null }));
        const [countries, companyCommissionRules, businessSettings] = await Promise.all([
          countryAPI.getAll(),
          companyCommissionRuleAPI.getAll(),
          fetch(`${window.location.origin.replace(':5173', ':3001')}/api/business-settings`)
            .then(res => res.ok ? res.json() : null)
        ]);
        setState((prev: SettingsState) => ({ 
          ...prev, 
          countries, 
          companyCommissionRules, 
          businessSettings, 
          isLoading: false 
        }));
      } catch (error) {
        console.error('加载设置数据失败:', error);
        setState((prev: SettingsState) => ({ 
          ...prev, 
          isLoading: false, 
          error: '加载设置数据失败' 
        }));
      }
    };

    loadSettings();
  }, []);

  // WebSocket监听设置更新
  useEffect(() => {
    const handleDataUpdate = (data: any) => {
      switch (data.type) {
        case 'country-created':
          setState((prev: SettingsState) => ({
            ...prev,
            countries: [...prev.countries, data.data].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          }));
          break;
        case 'country-updated':
          setState((prev: SettingsState) => ({
            ...prev,
            countries: prev.countries.map((country: Country) => 
              country.id === data.data.id ? data.data : country
            ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          }));
          break;
        case 'country-deleted':
          setState((prev: SettingsState) => ({
            ...prev,
            countries: prev.countries.filter((country: Country) => country.id !== data.data.id)
          }));
          break;
        case 'company-commission-rule-created':
          setState((prev: SettingsState) => ({
            ...prev,
            companyCommissionRules: [...prev.companyCommissionRules, data.data].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          }));
          break;
        case 'company-commission-rule-updated':
          setState((prev: SettingsState) => ({
            ...prev,
            companyCommissionRules: prev.companyCommissionRules.map((rule: CompanyCommissionRule) => 
              rule.id === data.data.id ? data.data : rule
            ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          }));
          break;
        case 'company-commission-rule-deleted':
          setState((prev: SettingsState) => ({
            ...prev,
            companyCommissionRules: prev.companyCommissionRules.filter((rule: CompanyCommissionRule) => rule.id !== data.data.id)
          }));
          break;
        case 'business-settings-updated':
          setState((prev: SettingsState) => ({
            ...prev,
            businessSettings: data.data
          }));
          break;
      }
    };

    websocketService.on('data-update', handleDataUpdate);

    return () => {
      websocketService.off('data-update', handleDataUpdate);
    };
  }, []);

  const addCountry = async (country: Omit<Country, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const createdCountry = await countryAPI.create(country);
      setState((prev: SettingsState) => ({
        ...prev,
        countries: [...prev.countries, createdCountry]
      }));
    } catch (error) {
      console.error('❌ 创建国家失败:', error);
    }
  };

  const updateCountry = async (id: string, country: Partial<Country>) => {
    try {
      const updatedCountry = await countryAPI.update(id, country);
      setState((prev: SettingsState) => ({
        ...prev,
        countries: prev.countries.map((c: Country) => 
          c.id === id ? updatedCountry : c
        )
      }));
    } catch (error) {
      console.error('❌ 更新国家失败:', error);
    }
  };

  const deleteCountry = async (id: string) => {
    try {
      await countryAPI.delete(id);
      setState((prev: SettingsState) => ({
        ...prev,
        countries: prev.countries.filter((country: Country) => country.id !== id)
      }));
    } catch (error) {
      console.error('❌ 删除国家失败:', error);
    }
  };

  const addCompanyCommissionRule = async (rule: Omit<CompanyCommissionRule, 'id'>) => {
    try {
      const createdRule = await companyCommissionRuleAPI.create(rule);
      setState((prev: SettingsState) => ({
        ...prev,
        companyCommissionRules: [...prev.companyCommissionRules, createdRule]
      }));
    } catch (error) {
      console.error('❌ 创建公司分成方案失败:', error);
      throw error;
    }
  };

  const updateCompanyCommissionRule = async (id: string, rule: Partial<CompanyCommissionRule>) => {
    try {
      const updatedRule = await companyCommissionRuleAPI.update(id, rule);
      setState((prev: SettingsState) => ({
        ...prev,
        companyCommissionRules: prev.companyCommissionRules.map((r: CompanyCommissionRule) => 
          r.id === id ? updatedRule : r
        )
      }));
    } catch (error) {
      console.error('❌ 更新公司分成方案失败:', error);
      throw error;
    }
  };

  const deleteCompanyCommissionRule = async (id: string) => {
    try {
      await companyCommissionRuleAPI.delete(id);
      setState((prev: SettingsState) => ({
        ...prev,
        companyCommissionRules: prev.companyCommissionRules.filter((r: CompanyCommissionRule) => r.id !== id)
      }));
    } catch (error) {
      console.error('❌ 删除公司分成方案失败:', error);
      throw error;
    }
  };

  const updateBusinessSettings = async (settings: BusinessSettings) => {
    try {
      const response = await fetch(`${window.location.origin.replace(':5173', ':3001')}/api/business-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const updatedSettings = await response.json();
      setState((prev: SettingsState) => ({
        ...prev,
        businessSettings: updatedSettings
      }));

    } catch (error) {
      console.error('❌ 更新业务设置失败:', error);
    }
  };

  const value: SettingsContextType = {
    ...state,
    addCountry,
    updateCountry,
    deleteCountry,
    addCompanyCommissionRule,
    updateCompanyCommissionRule,
    deleteCompanyCommissionRule,
    updateBusinessSettings,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsContext() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettingsContext must be used within a SettingsProvider');
  }
  return context;
} 