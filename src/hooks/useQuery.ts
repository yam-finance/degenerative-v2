// Wrap router useLocation hook for easy query parsing
import { useLocation } from 'react-router';

export const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};
