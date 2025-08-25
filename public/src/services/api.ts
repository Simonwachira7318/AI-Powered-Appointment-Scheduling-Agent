import { ApiResponse, Appointment, AvailabilitySlot } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async sendMessage(message: string): Promise<ApiResponse<{ reply: string; action?: string; data?: any }>> {
    return this.request('/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async getAppointments(startDate?: Date, endDate?: Date): Promise<ApiResponse<Appointment[]>> {
    const params = new URLSearchParams();
    if (startDate) params.append('start', startDate.toISOString());
    if (endDate) params.append('end', endDate.toISOString());
    
    return this.request(`/appointments?${params.toString()}`);
  }

  async createAppointment(appointment: Partial<Appointment>): Promise<ApiResponse<Appointment>> {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointment),
    });
  }

  async checkAvailability(date: Date, duration: number): Promise<ApiResponse<AvailabilitySlot[]>> {
    return this.request('/availability', {
      method: 'POST',
      body: JSON.stringify({ date: date.toISOString(), duration }),
    });
  }

  async deleteAppointment(id: string): Promise<ApiResponse> {
    return this.request(`/appointments/${id}`, {
      method: 'DELETE',
    });
  }

  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<ApiResponse<Appointment>> {
    return this.request(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }
}

export const apiService = new ApiService();