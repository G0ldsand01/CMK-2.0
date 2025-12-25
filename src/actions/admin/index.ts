import { analytics } from './analytics';
import { category } from './category';
import { coupons } from './coupons';
import { emailTemplates } from './email-templates';
import { logs } from './logs';
import { notifications as adminNotifications } from './notifications';
import { products } from './products';
import { reports } from './reports';
import { reviews } from './reviews';
import { settings } from './settings';
import { users } from './users';

export const admin = {
	category,
	products,
	users,
	coupons,
	reviews,
	analytics,
	reports,
	logs,
	notifications: adminNotifications,
	emailTemplates,
	settings,
};
