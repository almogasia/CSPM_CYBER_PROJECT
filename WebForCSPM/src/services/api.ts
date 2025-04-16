import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

export const performCalculation = async (data: any) => {
  const response = await api.post('/calculations', data);
  return response.data;
};

export const fetchData = async () => {
  const response = await api.get('/data');
  return response.data;
};

export default api;
