import { getReportList, markReportAsRead } from '../../storage/report-storage.js';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function formatDate(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);

  return `${year}년 ${month}월 ${day}일 (${WEEKDAY_LABELS[date.getDay()]})`;
}

export function createReportDetail(root) {
  const reportId = new URLSearchParams(window.location.search).get('id');
  const report = getReportList().find((item) => item.id === reportId);
  const dateField = root.querySelector('[data-field="report-date"]');
  const classField = root.querySelector('[data-field="report-class"]');
  const recipientField = root.querySelector('[data-field="report-recipient"]');
  const body = root.querySelector('[data-field="report-body"]');
  const emptyMessage = root.querySelector('[data-field="empty-message"]');

  if (!report) {
    emptyMessage.hidden = false;
    return;
  }

  markReportAsRead(report.id);
  dateField.textContent = formatDate(report.date);
  classField.textContent = report.className ?? report.classSnapshot?.name ?? '배정 클래스 없음';
  recipientField.textContent = `${report.recipientPetName} (다이얼독 유치원)`;
  body.innerHTML = `
    ${report.imagePath ? `<img class="report-detail__image" src="${report.imagePath}" alt="${report.recipientPetName} 알림장 사진" />` : ''}
    ${(report.detailContent ?? [report.content]).map((paragraph) => `<p class="report-detail__paragraph">${paragraph.replaceAll('\n', '<br />')}</p>`).join('')}
  `;

  root.addEventListener('click', (event) => {
    if (event.target.closest('[data-action="go-back"]')) window.location.assign('./report.html');
  });
}
