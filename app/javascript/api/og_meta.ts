import api from './base';
import { AxiosPromise } from 'axios';

export interface OGMeta {
  image?: string;
  title?: string;
  description?: string;
  site_name?: string;
}

export function getOGMeta(url: string): AxiosPromise<OGMeta> {
  return api.post('og_meta', { url });
}