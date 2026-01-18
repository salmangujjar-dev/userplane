import './CompanyCard.css';

import { isEnabled } from '../flags';
import type { Company } from '../types';

interface CompanyCardProps {
  company: Company;
}

function formatBatch(batch: string): string {
  if (!batch) return '';

  const season = batch.charAt(0).toUpperCase();
  const year = batch.slice(1);
  const fullYear = parseInt(year) > 50 ? `19${year}` : `20${year}`;

  switch (season) {
    case 'S':
      return `SUMMER ${fullYear}`;
    case 'W':
      return `WINTER ${fullYear}`;
    case 'F':
      return `FALL ${fullYear}`;
    case 'X':
      return `SPRING ${fullYear}`;
    default:
      return batch.toUpperCase();
  }
}

export default function CompanyCard({ company }: CompanyCardProps) {
  const location = company.locations?.[0] || '';

  return (
    <a href={company.url} target="_blank" rel="noopener noreferrer" className="company-card">
      {isEnabled('companyLogo') && (
        <div className="company-logo">
          {company.smallLogoUrl ? (
            <img src={company.smallLogoUrl} alt={`${company.name} logo`} loading="lazy" />
          ) : (
            <div className="logo-placeholder">{company.name.charAt(0)}</div>
          )}
        </div>
      )}

      <div className="company-info">
        <div className="company-header">
          <h3 className="company-name">{company.name}</h3>
          {isEnabled('companyLocation') && location && (
            <span className="company-location">{location}</span>
          )}
        </div>

        <p className="company-description">{company.oneLiner}</p>

        <div className="company-tags">
          {isEnabled('batchTag') && company.batch && (
            <span className="tag tag-batch">
              <span className="yc-icon">Y</span>
              {formatBatch(company.batch)}
            </span>
          )}
          {isEnabled('industryTags') &&
            company.industries.slice(0, 2).map((industry) => (
              <span key={industry} className="tag">
                {industry.toUpperCase()}
              </span>
            ))}
        </div>
      </div>
    </a>
  );
}
