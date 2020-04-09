const cennzx = [
  {
    name: 'buyPrice',
    description: 'Retrieves the spot exchange buy price',
    params: [
      { name: 'AssetToBuy', type: 'AssetId' },
      { name: 'Amount', type: 'Balance' },
      { name: 'AssetToPay', type: 'AssetId' }
    ],
    type: 'Balance'
  },
  {
    name: 'sellPrice',
    description: 'Retrieves the spot exchange sell price',
    params: [
      { name: 'AssetToSell', type: 'AssetId' },
      { name: 'Amount', type: 'Balance' },
      { name: 'AssetToPayout', type: 'AssetId' }
    ],
    type: 'Balance'
  }
];

export default {
  cennzx
};
