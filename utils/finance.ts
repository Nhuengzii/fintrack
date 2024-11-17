export const thbFormatter = new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB'
});

export const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};
