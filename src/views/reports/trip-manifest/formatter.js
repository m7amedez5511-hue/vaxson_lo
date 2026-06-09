/**
 * Trip Manifest HTML Formatters
 * Encapsulates HTML fragment generation to keep services clean.
 */

export const formatOrderRow = (index, shipmentNumber, { reason, isDelivered, isReturned, isInProgress }) => {
  return `
    <tr>
      <td>${index + 1}</td>
      <td style="font-weight: bold;" dir="ltr">${shipmentNumber}</td>
      <td>${isInProgress ? '<span style="font-size: 18px;">⌛</span>' : ''}</td>
      <td>${isDelivered ? '<span style="font-size: 18px;">✔</span>' : ''}</td>
      <td>${isReturned ? '<span style="font-size: 18px;">✖</span>' : ''}</td>
      <td style="text-align: right; padding-right: 10px;">${reason}</td>
    </tr>
  `;
};

export const formatCarDetails = (car) => {
  if (!car) return '---';
  return `
    <span style="border: 2px solid #333; padding: 2px 10px; border-radius: 4px; font-weight: bold; letter-spacing: 2px;">
      ${car.plateNumber || ''} | ${car.plateLetters || ''}
    </span>
  `;
};
