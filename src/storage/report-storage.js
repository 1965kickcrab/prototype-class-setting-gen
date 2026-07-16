import { DEFAULT_REPORT_LIST } from './default-report-list.js';

const REPORT_LIST_KEY = 'reportList';

export function getReportList() {
  try {
    const storedValue = window.localStorage.getItem(REPORT_LIST_KEY);
    const parsedValue = storedValue ? JSON.parse(storedValue) : null;

    if (!Array.isArray(parsedValue)) return DEFAULT_REPORT_LIST;

    const storedReportsById = new Map(parsedValue.map((report) => [report.id, report]));
    const mergedDefaultReports = DEFAULT_REPORT_LIST.map((report) => ({ ...report, ...storedReportsById.get(report.id) }));
    const additionalReports = parsedValue.filter((report) => !DEFAULT_REPORT_LIST.some((defaultReport) => defaultReport.id === report.id));

    return [...mergedDefaultReports, ...additionalReports];
  } catch {
    return DEFAULT_REPORT_LIST;
  }
}

export function markReportAsRead(reportId) {
  const reportList = getReportList();
  const updatedReportList = reportList.map((report) => (
    report.id === reportId ? { ...report, isRead: true } : report
  ));

  window.localStorage.setItem(REPORT_LIST_KEY, JSON.stringify(updatedReportList));

  return updatedReportList.find((report) => report.id === reportId) ?? null;
}
