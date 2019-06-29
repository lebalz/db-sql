import axios from 'axios';

export namespace Api {
  export const BASE_API_URL = dbSqlApiUrl();
  export const RIDE_URL = dbSqlUrl();

  function dbSqlUrl() {
    switch (process.env.NODE_ENV) {
      case 'development':
        return 'http://localhost:3000';
      default:
        return 'https://db-sql.ch';
    }
  }

  function dbSqlApiUrl() {
    return `${dbSqlUrl()}/api/`;
  }
}

const api = axios.create({
  baseURL: Api.BASE_API_URL,
  headers: {}
});

(<any>window).api = api;

export default api;