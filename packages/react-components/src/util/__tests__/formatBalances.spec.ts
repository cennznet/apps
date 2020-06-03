import '../formatBalances';

describe('Balance formatting', () => {
  describe('Format with moving 4 d.p right', () => {
    it('formats 0', () => {
      const result = '0';
      expect(result).toBe('0');
    });

    it('formats 0.0001', () => {
      const result = '1';
      expect(result).toBe('1');
    });

    it('formats 0.001', () => {
      const result = '10';
      expect(result).toBe('10');
    });

    it('formats 0.01', () => {
      const result = '100';
      expect(result).toBe('100');
    });

    it('formats 0.1', () => {
      const result = '1000';
      expect(result).toBe('1000');
    });

    it('formats 1', () => {
      const result = '10000';
      expect(result).toBe('10000');
    });

    it('formats 10', () => {
      const result = '100000';
      expect(result).toBe('100000');
    });

    it('formats 100', () => {
      const result = '1000000';
      expect(result).toBe('1000000');
    });

    it('formats 1000', () => {
      const result = '1000000';
      expect(result).toBe('1000000');
    });

    it('formats 1,000', () => {
      const result = '10000000';
      expect(result).toBe('10000000');
    });

    it('formats 1,000,000', () => {
      const result = '10000000000';
      expect(result).toBe('10000000000');
    });
  });

  describe('Format with moving 4 d.p left', () => {
    it('formats 0', () => {
      const result = '0';
      expect(result).toBe('0');
    });

    it('formats 1', () => {
      const result = '0.0001';
      expect(result).toBe('0.0001');
    });

    it('formats 10', () => {
      const result = '0.001';
      expect(result).toBe('0.001');
    });

    it('formats 100', () => {
      const result = '0.01';
      expect(result).toBe('0.01');
    });

    it('formats 1000', () => {
      const result = '0.1';
      expect(result).toBe('0.1');
    });

    it('formats 10000', () => {
      const result = '1';
      expect(result).toBe('1');
    });

    it('formats 100000', () => {
      const result = '10';
      expect(result).toBe('10');
    });

    it('formats 1000000', () => {
      const result = '100';
      expect(result).toBe('100');
    });

    it('formats 10000000', () => {
      const result = '100';
      expect(result).toBe('100');
    });

    it('formats 10000000', () => {
      const result = '1000';
      expect(result).toBe('1000');
    });
  });
});
