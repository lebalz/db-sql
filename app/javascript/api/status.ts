import api from './base';
import { AxiosPromise } from 'axios';

export interface Commit {
  commit: string;
  link: string;
}

export function getCommit(): AxiosPromise<Commit> {
  return api.get('commit');
}