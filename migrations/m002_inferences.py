from .base_migration import BaseMigration
import json

class InferencesMigration(BaseMigration):
    @property
    def version(self) -> str:
        return "002"
    
    @property
    def description(self) -> str:
        return "All inferences: lateritic nickel, underground drilling, capping, area analysis, and clustering"
    
    # ========== ADICIONAR NOVAS INFERÊNCIAS AQUI ==========
    INFERENCES = [
        {
            "id": "ni_lateritico",
            "title": "Lateritic Ni",
            "type": "interpretation",
            "evidence": {
                "assemblage": "Ni + Si + Mg",
                "lithology": "Laterite",
                "mineralization": "Horizontal",
                "ranking": "Lateritic Ni (65%), Sulfide Ni (20%), Magmatic Ni-Cu (10%), Hydrothermal Ni-Co (5%)"
            },
            "implications": [
                "Typical lateritic nickel deposit",
                "Weathering-related enrichment",
                "Horizontal stratification expected"
            ],
            "recommendations": [
                "Focus on weathering horizons",
                "Map enrichment zones",
                "Consider horizontal domains"
            ]
        },
        {
            "id": "underground",
            "title": "Underground Drilling",
            "type": "interpretation",
            "evidence": {
                "z": "Negative values",
                "dip": "Positive values"
            },
            "implications": [
                "Deep underground mine",
                "Drilling from underground galleries",
                "Coordinate transformation required"
            ],
            "recommendations": [
                "Validate coordinate system",
                "Check gallery surveys",
                "Map underground workings"
            ]
        },
        {
            "id": "capping",
            "title": "Grade Capping Required",
            "type": "action",
            "evidence": {
                "CV": "> 3",
                "outliers": "Present in dataset"
            },
            "implications": [
                "High grade variability",
                "Possible local bias in estimation",
                "Risk of overestimation in kriging"
            ],
            "recommendations": [
                "Perform statistical analysis",
                "Define capping values per domain",
                "Document outlier treatment"
            ]
        },
        {
            "id": "variograma",
            "title": "Strong Anisotropy Variogram",
            "type": "action",
            "evidence": {
                "deposit_type": "Lateritic Ni",
                "mineralization": "Horizontal layers"
            },
            "implications": [
                "Preferential horizontal continuity",
                "Anisotropy ratio > 3:1 (H:V)",
                "Longer range in horizontal plane"
            ],
            "recommendations": [
                "Use anisotropic variography",
                "Consider vertical zoning",
                "Map continuity directions"
            ]
        },
        {
            "id": "krigagem",
            "title": "Anisotropic Kriging in Z",
            "type": "action",
            "evidence": {
                "anisotropy": "Strong horizontal continuity",
                "ratio": "> 3:1 (H:V)"
            },
            "implications": [
                "Standard isotropic search will oversmooth",
                "Vertical mixing of different horizons",
                "Need for anisotropic ellipsoid"
            ],
            "recommendations": [
                "Use anisotropic search",
                "Validate estimation results",
                "Consider vertical domains"
            ]
        },
        {
            "id": "trend_vertical",
            "title": "Vertical Grade Trend",
            "type": "interpretation",
            "evidence": {
                "deposit_type": "Lateritic",
                "grades": "Ni > 0.65%"
            },
            "implications": [
                "Gradual grade decrease with depth expected",
                "Possible barren weathering cap at top",
                "Higher enrichment in transition zone",
                "Vertical zonation typical of laterites"
            ],
            "recommendations": [
                "Map vertical grade distribution",
                "Define enrichment zones",
                "Consider vertical domaining"
            ]
        },
        {
            "id": "area_analysis",
            "title": "Area Analysis",
            "type": "action",
            "evidence": {
                "dimensions": "50km x 10km",
                "area": "500 km²",
                "calculation": "Based on X,Y extents"
            },
            "implications": [
                "Unusually large area for single deposit",
                "Suggests multiple mineralization centers",
                "Regional-scale exploration project"
            ],
            "recommendations": [
                "Perform spatial clustering analysis",
                "Evaluate each target separately",
                "Consider staged exploration approach"
            ]
        },
        {
            "id": "cluster_analysis",
            "title": "Target Clustering",
            "type": "action",
            "evidence": {
                "method": "K-means clustering",
                "n_clusters": 4,
                "variables": ["X", "Y", "Ni grade"],
                "visualization": {
                    "type": "scatter_plot",
                    "x": "X",
                    "y": "Y",
                    "color": "cluster_id",
                    "data": "Click to view clusters map"
                }
            },
            "implications": [
                "4 distinct mineralization centers identified",
                "Each target requires individual assessment",
                "Possible different geological controls"
            ],
            "recommendations": [
                "Create separate resource models per target",
                "Evaluate grade distribution per cluster",
                "Design target-specific drilling campaigns"
            ]
        },
        {
            "id": "contact_analysis",
            "title": "Sharp Contact Analysis",
            "type": "action",
            "evidence": {
                "contact_type": "Dike/Weathering boundary",
                "sharpness": "Well-defined (< 1m)",
                "ni_gradient": "Abrupt grade change across contact",
                "oxidation_boundary": "Sharp weathering-fresh contact"
            },
            "implications": [
                "Sharp contacts indicate distinct weathering zones",
                "Abrupt compositional changes suggest structural control",
                "Contact zones are high-risk areas for estimation bias",
                "Potential for contact-controlled mineralization"
            ],
            "recommendations": [
                "Map contact geometry with precision",
                "Create separate domains on either side of contact",
                "Use contact as hard boundary in kriging",
                "Validate contact continuity with structural data",
                "Assess lateral extension of contact-related enrichment"
            ]
        },
        {
            "id": "litho_grade_relationship",
            "title": "Lithotype-Controlled Mineralization",
            "type": "interpretation",
            "evidence": {
                "strong_correlation": "Ni grades strongly correlated with lithotype",
                "sap_enrichment": "SAP (Saprolite) shows 2-3x higher Ni than Fresh",
                "lat_enrichment": "LAT (Laterite) shows highest Ni concentration",
                "compositional_control": "Si + Mg distribution matches lithotype boundaries"
            },
            "implications": [
                "Lithotype is primary control on Ni distribution",
                "Weathering intensity directly correlates with grade",
                "Separate populations require separate estimation",
                "Contact-driven enrichment is predictable from litho patterns"
            ],
            "recommendations": [
                "Create hard lithotype-based domains",
                "Validate Ni means per lithotype",
                "Use lithotype as drift term in kriging",
                "Map weathering intensity zones",
                "Consider indicator kriging by lithotype"
            ]
        },
        {
            "id": "depth_grade_trend",
            "title": "Depth-Dependent Grade Degradation",
            "type": "interpretation",
            "evidence": {
                "surface_enrichment": "Maximum Ni grades in first 50m",
                "degradation_rate": "Grade decreases ~10% per 50m depth",
                "barren_cap": "Oxidized surface zone with low Ni",
                "enrichment_zone": "Peak grades in transition zone (SAP)"
            },
            "implications": [
                "Typical laterite profile: barren cap → enrichment → fresh rock",
                "Superficial enrichment controlled by weathering intensity",
                "Resource heavily concentrated in upper 150m",
                "Deep zones unlikely to contribute to economic resource"
            ],
            "recommendations": [
                "Focus resource estimation on 0-150m interval",
                "Create depth-based domains",
                "Apply depth trend in kriging",
                "Validate zone transitions with logging",
                "Assess economic depth cutoff"
            ]
        },
        {
            "id": "drill_orientation_bias",
            "title": "Dip-Related Sampling Bias",
            "type": "interpretation",
            "evidence": {
                "steep_dip_grades": "Steep dip holes (>70°) show higher Ni",
                "shallow_dip_grades": "Shallow dip holes (<30°) show lower Ni",
                "lateral_control": "Dip correlates with horizontal distance traveled",
                "lithotype_mixing": "Different dips sample different lithotypes at same depth"
            },
            "implications": [
                "Drill orientation creates systematic sampling bias",
                "Steep holes preferentially sample enriched zones",
                "Shallow holes traverse more barren material",
                "Composite statistics are biased by hole orientation distribution"
            ],
            "recommendations": [
                "Stratify composites by dip angle",
                "Use dip as co-variable in kriging",
                "Validate with oriented drill logs",
                "Consider desurveying correction",
                "Create dip-based subsets for statistics"
            ]
        },
        {
            "id": "compositional_maturity",
            "title": "Ni-Si-Mg Assemblage Maturity",
            "type": "interpretation",
            "evidence": {
                "ratio_calculation": "Ni/(Si+Mg) indicates weathering maturity",
                "high_ratio_zones": "Ratio > 0.3 indicates intense alteration",
                "low_ratio_zones": "Ratio < 0.1 indicates fresh rock",
                "assemblage_control": "Specific mineral associations at different ratios"
            },
            "implications": [
                "Compositional ratio is proxy for weathering intensity",
                "High-ratio zones are enriched (laterite/saprolite)",
                "Low-ratio zones are barren or unaltered",
                "Maturity index predicts Ni better than individual elements"
            ],
            "recommendations": [
                "Calculate maturity index for all samples",
                "Map maturity zones on cross-sections",
                "Use maturity as drift variable in kriging",
                "Validate zones with microXRF/SEM analysis",
                "Create maturity-based resource categories"
            ]
        },
        {
            "id": "data_spacing_sufficiency",
            "title": "Sample Spacing vs Variability",
            "type": "interpretation",
            "evidence": {
                "mean_spacing": "Average inter-sample distance: 45m",
                "high_grade_zone_spacing": "Spacing only 20m in enrichment zones",
                "low_grade_zone_spacing": "Spacing up to 150m in barren areas",
                "variance_ratio": "Ni variance 3x higher than drill spacing efficiency"
            },
            "implications": [
                "Current spacing adequate for barren zones only",
                "Enrichment zones are under-sampled",
                "High-grade zones require denser drilling",
                "Kriging uncertainty will be high in sparse areas"
            ],
            "recommendations": [
                "Intensify drilling in high-grade zones",
                "Target 30m spacing in enrichment zones",
                "Maintain 100m spacing in barren zones",
                "Use kriging variance to identify gaps",
                "Plan infill drilling based on variance map"
            ]
        },
        {
            "id": "hole_type_performance",
            "title": "DDH vs RC Grade Comparison",
            "type": "interpretation",
            "evidence": {
                "ddh_mean": "DDH average Ni grade: 1.25%",
                "rc_mean": "RC average Ni grade: 0.98%",
                "recovery_issue": "RC shows 20-25% lower grades",
                "fines_loss": "RC loses fine material in return circulation"
            },
            "implications": [
                "RC significantly under-samples Ni (loses fines)",
                "RC grades biased low for laterite-hosted Ni",
                "Resource estimates based on RC are too conservative",
                "Mixing DDH and RC requires correction factors"
            ],
            "recommendations": [
                "Apply +20% correction to RC grades",
                "Stratify statistics by hole type",
                "Prioritize DDH drilling in resource areas",
                "Validate RC correction with comparison holes",
                "Consider recovery percentage per depth zone"
            ]
        }
    ]

    # ========== RELACIONAMENTOS ENTRE INFERÊNCIAS ==========
    RELATIONSHIPS = {
        "ni_lateritico": {
            "sources": ["assay.elements.Ni", "assay.elements.Si", "assay.elements.Mg", "lithology.LITO"],
            "targets": ["variograma", "trend_vertical"]
        },
        "underground": {
            "sources": ["collar.z", "survey.dip"],
            "targets": []
        },
        "capping": {
            "sources": ["assay.elements.Ni"],
            "targets": []
        },
        "variograma": {
            "sources": ["ni_lateritico"],
            "targets": ["krigagem"]
        },
        "krigagem": {
            "sources": ["variograma"],
            "targets": []
        },
        "trend_vertical": {
            "sources": ["ni_lateritico"],
            "targets": []
        },
        "area_analysis": {
            "sources": ["collar.x", "collar.y"],
            "targets": ["cluster_analysis"]
        },
        "cluster_analysis": {
            "sources": ["area_analysis", "assay.elements.Ni"],
            "targets": []
        },
        "contact_analysis": {
            "sources": ["lithology.LITO", "assay.elements.Ni", "assay.elements.Si", "assay.elements.Mg"],
            "targets": []
        },
        "litho_grade_relationship": {
            "sources": ["lithology.LITO", "assay.elements.Ni", "assay.elements.Si", "assay.elements.Mg"],
            "targets": []
        },
        "depth_grade_trend": {
            "sources": ["collar.z", "collar.depth", "assay.elements.Ni"],
            "targets": []
        },
        "drill_orientation_bias": {
            "sources": ["survey.dip", "assay.elements.Ni"],
            "targets": []
        },
        "compositional_maturity": {
            "sources": ["assay.elements.Ni", "assay.elements.Si", "assay.elements.Mg"],
            "targets": []
        },
        "data_spacing_sufficiency": {
            "sources": ["collar.x", "collar.y", "collar.depth", "assay.elements.Ni"],
            "targets": []
        },
        "hole_type_performance": {
            "sources": ["collar.drill_type", "assay.elements.Ni"],
            "targets": []
        }
    }
    
    def up(self):
        self._create_all_inferences()
        self._create_all_relationships()
    
    def _create_all_inferences(self):
        """Cria TODAS as inferências a partir da lista INFERENCES"""
        for inf in self.INFERENCES:
            self.run_query("""
                CREATE (i:Inference {
                    id: $id,
                    title: $title,
                    type: $type,
                    evidence: $evidence,
                    implications: $implications,
                    recommendations: $recommendations
                })
            """, {
                "id": inf["id"],
                "title": inf["title"],
                "type": inf["type"],
                "evidence": json.dumps(inf["evidence"]),
                "implications": json.dumps(inf["implications"]),
                "recommendations": json.dumps(inf["recommendations"])
            })
    
    def _create_all_relationships(self):
        """Cria TODOS os relacionamentos baseado na config RELATIONSHIPS"""
        for inf_id, rels in self.RELATIONSHIPS.items():
            # Conectar fontes de dados (SUPPORTS)
            for source_id in rels.get("sources", []):
                self.run_query("""
                    MATCH (source {id: $source_id})
                    MATCH (i:Inference {id: $inf_id})
                    MERGE (source)-[:SUPPORTS]->(i)
                """, {
                    "source_id": source_id,
                    "inf_id": inf_id
                })
            
            # Conectar a outras inferências (LEADS_TO)
            for target_id in rels.get("targets", []):
                self.run_query("""
                    MATCH (i:Inference {id: $inf_id})
                    MATCH (target:Inference {id: $target_id})
                    MERGE (i)-[:LEADS_TO]->(target)
                """, {
                    "inf_id": inf_id,
                    "target_id": target_id
                })
    
    def down(self):
        # Remove all inference nodes
        self.run_query("""
            MATCH (n:Inference)
            DETACH DELETE n
        """)
