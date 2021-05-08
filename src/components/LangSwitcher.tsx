import React from 'react';
import { useTranslation } from 'react-i18next';

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  return (
    <div className="select">
      <select value={i18n.language} onChange={(e) => i18n.changeLanguage(e.target.value)}>
        <option value="zh">Chinese</option>
        <option value="en">English</option>
        <option value="fr">French</option>
        <option value="de">German</option>
      </select>
    </div>
  );
};
