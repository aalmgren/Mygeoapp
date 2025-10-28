export const mockValidations = {
  collar: {
    total: 200,
    rules: [
      {
        id: 'c1',
        check: 'Coordinate system validation (WGS84 UTM Zone 54S)',
        severity: 'error',
        details: [
          'XCOLLAR: 12 holes outside valid easting range (300000-400000mE)',
          'YCOLLAR: 8 holes outside valid northing range (7000000-8000000mN)',
          'ZCOLLAR: 3 holes with Z > topographic surface (+150m discrepancy)',
          'Suspected local grid vs UTM mismatch in SW sector'
        ]
      },
      {
        id: 'c2',
        check: 'Hole ID naming convention (JORC compliant)',
        severity: 'error',
        details: [
          'DDH-2024-045A: Invalid year prefix (should be project code)',
          'RC_198: Missing campaign identifier and hyphen format',
          '15 holes lack drill type prefix (DDH- vs RC-)',
          'Recommended format: [TYPE]-[CAMPAIGN]-[SEQ][SUFFIX]'
        ]
      },
      {
        id: 'c3',
        check: 'End-of-hole depth consistency',
        severity: 'error',
        details: [
          'DDH-045: Collar depth=250m, last survey=248m (2m gap)',
          'DDH-102: Collar depth=180m, last assay=185m (over-depth sampling)',
          '23 holes show depth mismatch > 0.5m (excessive drill string stretch?)',
          'Recommend survey validation and downhole depth reconciliation'
        ]
      },
      {
        id: 'c4',
        check: 'Spatial collision detection (< 5m tolerance)',
        severity: 'error',
        details: [
          'DDH-045 and DDH-045A: Same collar (0.2m apart) - confirm wedge vs twin',
          'RC-198 and DDH-199: Overlapping collars (3.1m) in Grid 400E-2000N',
          'Cluster of 12 holes within 10m radius in Target A (dense infill?)',
          'Recommend collar survey validation and project database reconciliation'
        ]
      }
    ]
  },

  survey: {
    total: 150,
    rules: [
      {
        id: 's1',
        check: 'Downhole deviation analysis (DIP angle validation)',
        severity: 'error',
        details: [
          'DDH-034: DIP changed from -85° to -45° over 50m (40° deviation - tool failure?)',
          'RC-156: Positive dip (+12°) detected at 120m (uphole drilling anomaly)',
          '18 holes show > 15° deviation within 30m interval (excessive curvature)',
          'Magnetic interference suspected in holes near ultramafic contact'
        ]
      },
      {
        id: 's2',
        check: 'Azimuth consistency and magnetic declination',
        severity: 'error',
        details: [
          'BRG variance > 45° in 8 vertical holes (magnetic tool malfunction?)',
          'Azimuth 0° default value detected in 5 holes (missing survey data)',
          'Declination correction not applied (12° offset from grid north)',
          'Recommend gyro survey validation for resource holes'
        ]
      },
      {
        id: 's3',
        check: 'Survey interval spacing and EOH validation',
        severity: 'error',
        details: [
          'DDH-067: 80m gap between surveys (exceeds 30m JORC guideline)',
          '12 holes missing final EOH survey (depth extrapolation required)',
          'Survey@0m (collar) missing in 6 holes (assume vertical?)',
          'Recommend infill surveys for resource classification upgrade'
        ]
      }
    ]
  },

  assay: {
    total: 150,
    rules: [
      {
        id: 'a1',
        check: 'Geochemical values and detection limits (pXRF + Lab ICP)',
        severity: 'error',
        details: [
          'Ni: 3 samples > 5.5% (above laterite typical max, reanalyze for sulfide zones)',
          'Si: 12 samples < 15% (unusually low for ultramafic, check for Fe oxides)',
          'Mg: 45 samples returned as <DL (detection limit issue, use lower LOD method)',
          'Ni/MgO ratio > 10 in 8 samples (unrealistic for laterite, suspect lab contamination)'
        ]
      },
      {
        id: 'a2',
        check: 'QAQC protocol compliance (CRM + Field Duplicates + Blanks)',
        severity: 'warning',
        details: [
          'Standards: OREAS-45e drift detected (+8% bias after sample 450)',
          'Field duplicates: 6 pairs show >15% RPD (poor field sampling precision)',
          'Blanks: 2 contamination events detected (Ni > 0.05% in blank material)',
          'Lab batch LB-2024-08: Failed QC, 67 samples require re-assay'
        ]
      },
      {
        id: 'a3',
        check: 'Composite interval validation and sample recovery',
        severity: 'error',
        details: [
          'DDH-089: 5m gap in assay interval (140-145m missing - lost core?)',
          'RC-045: Overlapping intervals detected (88-90m + 89-91m duplicate compositing)',
          '34 samples show <80% recovery (reject or apply density correction)',
          'Composite length variance: 0.5-3.0m (standardize to 1m for resource est.)'
        ]
      }
    ]
  },

  lithology: {
    total: 80,
    rules: [
      {
        id: 'l1',
        check: 'Lithology code standardization (domain dictionary compliance)',
        severity: 'error',
        details: [
          'Code "SAPRO" detected: Use standard "SAP" (8 intervals affected)',
          'Code "laterite" vs "LAT": Case-sensitivity issue (15 intervals)',
          '"UNK" (Unknown) used in 23 intervals - requires re-logging',
          'Transitional codes missing: Need SAP/LAT gradational boundary codes'
        ]
      },
      {
        id: 'l2',
        check: 'Logging interval continuity and EOH coverage',
        severity: 'error',
        details: [
          'DDH-078: Lithology gap 45-52m (7m unlogged - low recovery zone?)',
          'DDH-012: Overlapping litho intervals (125-130m + 128-133m)',
          '5 holes: Lithology ends before collar depth (incomplete logging)',
          'Weathering contact zone poorly defined (5-15m thick transition)'
        ]
      },
      {
        id: 'l3',
        check: 'Geological description quality and consistency',
        severity: 'warning',
        details: [
          '34 intervals logged as "SAP" with no texture/color qualifier',
          'Oxidation state missing in 67% of laterite intervals (critical for domains)',
          'Logging geologist changed at hole 150 - terminology drift detected',
          'Recommend standardized logging template and cross-validation by senior geo'
        ]
      }
    ]
  }
};
