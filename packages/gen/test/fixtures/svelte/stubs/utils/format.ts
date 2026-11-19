const formatDate = (value: string | Date, locale = 'en') => new Intl.DateTimeFormat(locale).format(new Date(value));

export { formatDate };
