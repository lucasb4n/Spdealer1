import axios from 'axios';
import type { WebFunction } from 'flow';

import { API_BASE_URL } from './apiConfig';

const API_URL = API_BASE_URL;

export class WebFunctionsService {
  static async listAll(): Promise<WebFunction[]> {
    const resp = await axios.get(`${API_URL}/web-functions`);
    return resp.data ?? [];
  }

  static async getByCategory(category: string): Promise<WebFunction[]> {
    const resp = await axios.get(`${API_URL}/web-functions`, { params: { category } });
    return resp.data ?? [];
  }
}













