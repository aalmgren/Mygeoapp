export const mockValidations = {
  collar: {
    total: 200,
    rules: [
      {
        id: 'c1',
        check: 'Coordinates present and valid',
        severity: 'error',
        details: [
          'X coordinate must be between 300000 and 400000',
          'Y coordinate must be between 7000000 and 8000000',
          'Z coordinate must be between -1000 and 2000'
        ]
      },
      {
        id: 'c2',
        check: 'Hole ID format validation',
        severity: 'error',
        details: [
          'Must start with DDH- or RC-',
          'Must be followed by 3-4 digits',
          'Optional A-Z suffix'
        ]
      },
      {
        id: 'c3',
        check: 'Depth validation',
        severity: 'error',
        details: [
          'Must be positive',
          'Must be less than 1000m',
          'Must match last survey depth'
        ]
      },
      {
        id: 'c4',
        check: 'Duplicate hole check',
        severity: 'error',
        details: [
          'No duplicate hole IDs allowed',
          'Check for similar coordinates'
        ]
      }
    ]
  },

  survey: {
    total: 150,
    rules: [
      {
        id: 's1',
        check: 'Dip validation',
        severity: 'error',
        details: [
          'Must be between -90° and 90°',
          'Check for sudden changes > 15°'
        ]
      },
      {
        id: 's2',
        check: 'Azimuth validation',
        severity: 'error',
        details: [
          'Must be between 0° and 360°',
          'Check for sudden changes > 30°'
        ]
      },
      {
        id: 's3',
        check: 'Depth sequence',
        severity: 'error',
        details: [
          'Must be increasing',
          'No gaps allowed',
          'Must match collar depth'
        ]
      }
    ]
  },

  assay: {
    total: 150,
    rules: [
      {
        id: 'a1',
        check: 'Element values validation',
        severity: 'error',
        details: [
          'Ni must be between 0 and 5%',
          'Cu must be between 0 and 3%',
          'Co must be between 0 and 1%'
        ]
      },
      {
        id: 'a2',
        check: 'QAQC presence',
        severity: 'warning',
        details: [
          'Standards: 1 every 20 samples',
          'Duplicates: 1 every 20 samples',
          'Blanks: 1 every 50 samples'
        ]
      },
      {
        id: 'a3',
        check: 'Sample intervals',
        severity: 'error',
        details: [
          'No gaps allowed',
          'No overlaps allowed',
          'Must match lithology intervals'
        ]
      }
    ]
  },

  lithology: {
    total: 80,
    rules: [
      {
        id: 'l1',
        check: 'Valid codes',
        severity: 'error',
        details: [
          'Must match domain list',
          'No undefined codes',
          'Case sensitive'
        ]
      },
      {
        id: 'l2',
        check: 'Interval validation',
        severity: 'error',
        details: [
          'No gaps allowed',
          'No overlaps allowed',
          'Must match collar depth'
        ]
      },
      {
        id: 'l3',
        check: 'Description presence',
        severity: 'warning',
        details: [
          'Must have description',
          'Minimum 10 characters',
          'No generic descriptions'
        ]
      }
    ]
  }
};
