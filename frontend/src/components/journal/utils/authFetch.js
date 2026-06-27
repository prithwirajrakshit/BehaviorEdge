import { API_BASE } from '../../../api/client';

export async function authFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    ...(options.headers || {})
  };
  
  // Map the legacy standalone endpoints to the new unified/namespaced BehaviorEdge endpoints
  let targetUrl = url;
  if (url.startsWith('/api/trades')) {
    targetUrl = url.replace('/api/trades', '/api/journal/trades');
  } else if (url.startsWith('/api/daily_notes')) {
    targetUrl = url.replace('/api/daily_notes', '/api/journal/daily_notes');
  } else if (url.startsWith('/api/weekly_goals')) {
    targetUrl = url.replace('/api/weekly_goals', '/api/journal/weekly_goals');
  } else if (url.startsWith('/api/account_balance')) {
    targetUrl = url.replace('/api/account_balance', '/api/journal/account_balance');
  } else if (url.startsWith('/api/market_events')) {
    targetUrl = url.replace('/api/market_events', '/api/journal/market_events');
  } else if (url.startsWith('/api/trading_rules/')) {
    // e.g. /api/trading_rules/5 → /rules/5
    targetUrl = url.replace('/api/trading_rules/', '/rules/');
  } else if (url === '/api/trading_rules') {
    // POST/GET to collection — must have trailing slash to avoid FastAPI 307 redirect breaking CORS
    targetUrl = '/rules/';
  } else if (url.startsWith('/api/rule_checks')) {
    targetUrl = url.replace('/api/rule_checks', '/api/journal/rule_checks');
  } else if (url.startsWith('/api/analytics/')) {
    targetUrl = url.replace('/api/analytics/', '/api/journal/analytics/');
  }
  
  const response = await fetch(`${API_BASE}${targetUrl}`, { ...options, headers });
  return response;
}
