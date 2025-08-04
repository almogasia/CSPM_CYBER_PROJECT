import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
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
