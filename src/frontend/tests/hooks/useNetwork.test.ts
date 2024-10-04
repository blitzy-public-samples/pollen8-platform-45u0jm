import { renderHook, act } from '@testing-library/react-hooks';
import { useNetwork } from '@frontend/hooks/useNetwork';
import { ApiService } from '@frontend/services/api';
import { WebSocketService } from '@frontend/services/websocket';

jest.mock('@frontend/services/api');
jest.mock('@frontend/services/websocket');

describe('useNetwork hook', () => {
  let mockApiService: jest.Mocked<typeof ApiService>;
  let mockWebSocketService: jest.Mocked<typeof WebSocketService>;

  beforeEach(() => {
    jest.resetAllMocks();
    mockApiService = ApiService as jest.Mocked<typeof ApiService>;
    mockWebSocketService = WebSocketService as jest.Mocked<typeof WebSocketService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('InitialState', () => {
    it('should initialize with empty connections', () => {
      const { result } = renderHook(() => useNetwork());
      expect(result.current.connections).toEqual([]);
    });

    it('should initialize with zero network value', () => {
      const { result } = renderHook(() => useNetwork());
      expect(result.current.networkValue).toBe(0);
    });
  });

  describe('DataFetching', () => {
    it('should fetch network data on mount', async () => {
      const mockNetworkData = {
        connections: [{ id: 'conn1', userId: 'user1' }],
        networkValue: 3.14
      };
      mockApiService.getNetworkData.mockResolvedValue(mockNetworkData);

      const { result, waitForNextUpdate } = renderHook(() => useNetwork());

      expect(result.current.loading).toBe(true);

      await waitForNextUpdate();

      expect(mockApiService.getNetworkData).toHaveBeenCalled();
      expect(result.current.connections).toEqual(mockNetworkData.connections);
      expect(result.current.networkValue).toBe(mockNetworkData.networkValue);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('ConnectionManagement', () => {
    it('should add new connection', async () => {
      const { result } = renderHook(() => useNetwork());
      const userId = 'newUser123';

      await act(async () => {
        await result.current.addConnection(userId);
      });

      expect(mockApiService.addConnection).toHaveBeenCalledWith(userId);
    });

    it('should remove existing connection', async () => {
      const { result } = renderHook(() => useNetwork());
      const connectionId = 'conn123';

      await act(async () => {
        await result.current.removeConnection(connectionId);
      });

      expect(mockApiService.removeConnection).toHaveBeenCalledWith(connectionId);
    });
  });

  describe('WebSocketIntegration', () => {
    it('should update network value on websocket event', async () => {
      const { result } = renderHook(() => useNetwork());
      const newNetworkValue = 6.28;

      await act(async () => {
        mockWebSocketService.emit('network.update', { networkValue: newNetworkValue });
      });

      expect(result.current.networkValue).toBe(newNetworkValue);
    });
  });

  describe('IndustryFiltering', () => {
    it('should filter connections by industry', async () => {
      const mockConnections = [
        { id: 'conn1', userId: 'user1', industries: ['Tech'] },
        { id: 'conn2', userId: 'user2', industries: ['Finance'] }
      ];
      mockApiService.getNetworkData.mockResolvedValue({ connections: mockConnections, networkValue: 6.28 });

      const { result, waitForNextUpdate } = renderHook(() => useNetwork());

      await waitForNextUpdate();

      act(() => {
        result.current.filterByIndustry('Tech');
      });

      expect(result.current.filteredConnections).toEqual([mockConnections[0]]);
    });
  });

  describe('ErrorHandling', () => {
    it('should handle network fetch error', async () => {
      const errorMessage = 'Network error';
      mockApiService.getNetworkData.mockRejectedValue(new Error(errorMessage));

      const { result, waitForNextUpdate } = renderHook(() => useNetwork());

      await waitForNextUpdate();

      expect(result.current.error).toBe(errorMessage);
    });
  });
});