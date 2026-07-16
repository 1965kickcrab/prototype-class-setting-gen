import { attachBottomNavigation, renderBottomNavigation } from './components/bottom-navigation.js';
import { createReportList } from './features/report/report-list.js';

const bottomNavigationContainer = document.querySelector('[data-component="bottom-navigation"]');

bottomNavigationContainer.innerHTML = renderBottomNavigation('report');
attachBottomNavigation(bottomNavigationContainer);
createReportList(document.querySelector('.report-list'));
