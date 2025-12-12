import { category } from './category';
import { products } from './products';
import { users } from './users';
import { coupons } from './coupons';
import { reviews } from './reviews';
import { analytics } from './analytics';
import { reports } from './reports';
import { logs } from './logs';
import { notifications as adminNotifications } from './notifications';
import { emailTemplates } from './email-templates';

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
};
