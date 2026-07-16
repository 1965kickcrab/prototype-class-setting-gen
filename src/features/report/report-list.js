import { getReportList } from '../../storage/report-storage.js';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function formatMonth(dateKey) {
  const [year, month] = dateKey.split('-').map(Number);

  return `${year}년 ${month}월`;
}

function formatDate(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return `${month}월 ${day}일 ${WEEKDAY_LABELS[date.getDay()]}요일`;
}

export function createReportList(root) {
  const emptyMessage = root.querySelector('[data-field="empty-message"]');
  const reportList = root.querySelector('[data-field="report-list"]');
  const reports = getReportList().sort((first, second) => second.date.localeCompare(first.date));
  const reportsByMonth = reports.reduce((groups, report) => {
    const monthKey = report.date.slice(0, 7);

    groups.set(monthKey, [...(groups.get(monthKey) ?? []), report]);
    return groups;
  }, new Map());

  emptyMessage.hidden = reports.length > 0;
  reportList.innerHTML = [...reportsByMonth.entries()].map(([monthKey, monthReports]) => `
    <section class="report-list__month" aria-label="${formatMonth(monthKey)} 알림장">
      <h2 class="report-list__month-title">${formatMonth(monthKey)} <span aria-hidden="true">▼</span></h2>
      ${monthReports.map((report) => `
        <a class="report-card surface-card${report.isRead ? '' : ' surface-card--highlighted'}" href="report-detail.html?id=${report.id}">
          <div class="report-card__content">
            <p class="report-card__meta">${formatDate(report.date)}${report.isRead ? '' : ' · 읽지 않음'}</p>
            <h3 class="report-card__title">${report.recipientPetName} (다이얼독 유치원)</h3>
            <p class="report-card__summary">${report.content}</p>
          </div>
          ${report.imagePath ? `<img class="report-card__image" src="${report.imagePath}" alt="${report.recipientPetName} 알림장 사진" />` : ''}
        </a>
      `).join('')}
    </section>
  `).join('');
}
