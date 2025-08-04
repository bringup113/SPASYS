import io from 'socket.io-client';

class WebSocketService {
  private socket: any = null;
  private listeners: Map<string, Function[]> = new Map();

  // 连接到WebSocket服务器
  connect() {
    if (this.socket) {
      return;
    }

    // 获取当前域名和端口，替换为后端端口
    const currentOrigin = window.location.origin;
    const baseUrl = currentOrigin.replace(':5173', ':3001');
    
    this.socket = io(baseUrl);

    this.socket.on('connect', () => {
      // WebSocket连接成功
    });

    this.socket.on('disconnect', () => {
      // WebSocket连接断开
    });

    this.socket.on('data-update', (data: any) => {
      this.notifyListeners('data-update', data);
    });

    this.socket.on('error', (error: any) => {
      console.error('❌ WebSocket错误:', error);
    });
  }

  // 断开连接
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  // 添加事件监听器
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  // 移除事件监听器
  off(event: string, callback: Function) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  // 通知所有监听器
  private notifyListeners(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // 获取连接状态
  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

// 创建单例实例
export const websocketService = new WebSocketService(); 