from .base_migration import BaseMigration
import json

class InferencesMigration(BaseMigration):
    @property
    def version(self) -> str:
        return "002"
    
    @property
    def description(self) -> str:
        return "All inferences: lateritic nickel, underground drilling, capping, area analysis, and clustering"
    
    def up(self):
        # Create basic inferences
        self._create_ni_lateritic()
        self._create_underground()
        self._create_capping()
        self._create_variogram()
        self._create_kriging()
        self._create_vertical_trend()
        self._create_area_analysis()
        self._create_target_clustering()
        
        # Create all relationships at once
        self._create_relationships()
    
    def _create_ni_lateritic(self):
        self.run_query("""
            CREATE (ni_lat:Inference {
                id: 'ni_lateritico',
                title: 'Lateritic Ni',
                evidence: $ni_lat_evidence,
                implications: $ni_lat_implications,
                recommendations: $ni_lat_recommendations
            })
        """, {
            "ni_lat_evidence": json.dumps({
                "assemblage": "Ni + Si + Mg",
                "lithology": "Laterite",
                "mineralization": "Horizontal",
                "ranking": "Lateritic Ni (65%), Sulfide Ni (20%), Magmatic Ni-Cu (10%), Hydrothermal Ni-Co (5%)"
            }),
            "ni_lat_implications": json.dumps([
                "Typical lateritic nickel deposit",
                "Weathering-related enrichment",
                "Horizontal stratification expected"
            ]),
            "ni_lat_recommendations": json.dumps([
                "Focus on weathering horizons",
                "Map enrichment zones",
                "Consider horizontal domains"
            ])
        })

    def _create_underground(self):
        self.run_query("""
            CREATE (underg:Inference {
                id: 'underground',
                title: 'Underground Drilling',
                evidence: $underg_evidence,
                implications: $underg_implications,
                recommendations: $underg_recommendations
            })
        """, {
            "underg_evidence": json.dumps({
                "z": "Negative values",
                "dip": "Positive values"
            }),
            "underg_implications": json.dumps([
                "Deep underground mine",
                "Drilling from underground galleries",
                "Coordinate transformation required"
            ]),
            "underg_recommendations": json.dumps([
                "Validate coordinate system",
                "Check gallery surveys",
                "Map underground workings"
            ])
        })

    def _create_capping(self):
        self.run_query("""
            CREATE (capping:Inference {
                id: 'capping',
                title: 'Grade Capping Required',
                evidence: $capping_evidence,
                implications: $capping_implications,
                recommendations: $capping_recommendations
            })
        """, {
            "capping_evidence": json.dumps({
                "CV": "> 3",
                "outliers": "Present in dataset"
            }),
            "capping_implications": json.dumps([
                "High grade variability",
                "Possible local bias in estimation",
                "Risk of overestimation in kriging"
            ]),
            "capping_recommendations": json.dumps([
                "Perform statistical analysis",
                "Define capping values per domain",
                "Document outlier treatment"
            ])
        })

    def _create_variogram(self):
        self.run_query("""
            CREATE (var:Inference {
                id: 'variograma',
                title: 'Strong Anisotropy Variogram',
                evidence: $var_evidence,
                implications: $var_implications,
                recommendations: $var_recommendations
            })
        """, {
            "var_evidence": json.dumps({
                "deposit_type": "Lateritic Ni",
                "mineralization": "Horizontal layers"
            }),
            "var_implications": json.dumps([
                "Preferential horizontal continuity",
                "Anisotropy ratio > 3:1 (H:V)",
                "Longer range in horizontal plane"
            ]),
            "var_recommendations": json.dumps([
                "Use anisotropic variography",
                "Consider vertical zoning",
                "Map continuity directions"
            ])
        })

    def _create_kriging(self):
        self.run_query("""
            CREATE (krig:Inference {
                id: 'krigagem',
                title: 'Anisotropic Kriging in Z',
                evidence: $krig_evidence,
                implications: $krig_implications,
                recommendations: $krig_recommendations
            })
        """, {
            "krig_evidence": json.dumps({
                "anisotropy": "Strong horizontal continuity",
                "ratio": "> 3:1 (H:V)"
            }),
            "krig_implications": json.dumps([
                "Standard isotropic search will oversmooth",
                "Vertical mixing of different horizons",
                "Need for anisotropic ellipsoid"
            ]),
            "krig_recommendations": json.dumps([
                "Use anisotropic search",
                "Validate estimation results",
                "Consider vertical domains"
            ])
        })

    def _create_vertical_trend(self):
        self.run_query("""
            CREATE (trend:Inference {
                id: 'trend_vertical',
                title: 'Vertical Grade Trend',
                evidence: $trend_evidence,
                implications: $trend_implications,
                recommendations: $trend_recommendations
            })
        """, {
            "trend_evidence": json.dumps({
                "deposit_type": "Lateritic",
                "grades": "Ni > 0.65%"
            }),
            "trend_implications": json.dumps([
                "Gradual grade decrease with depth expected",
                "Possible barren weathering cap at top",
                "Higher enrichment in transition zone",
                "Vertical zonation typical of laterites"
            ]),
            "trend_recommendations": json.dumps([
                "Map vertical grade distribution",
                "Define enrichment zones",
                "Consider vertical domaining"
            ])
        })

    def _create_area_analysis(self):
        self.run_query("""
            CREATE (area:Inference {
                id: 'area_analysis',
                title: 'Area Analysis',
                evidence: $area_evidence,
                implications: $area_implications,
                recommendations: $area_recommendations
            })
        """, {
            "area_evidence": json.dumps({
                "dimensions": "50km x 10km",
                "area": "500 km²",
                "calculation": "Based on X,Y extents"
            }),
            "area_implications": json.dumps([
                "Unusually large area for single deposit",
                "Suggests multiple mineralization centers",
                "Regional-scale exploration project"
            ]),
            "area_recommendations": json.dumps([
                "Perform spatial clustering analysis",
                "Evaluate each target separately",
                "Consider staged exploration approach"
            ])
        })

    def _create_target_clustering(self):
        self.run_query("""
            CREATE (cluster:Inference {
                id: 'cluster_analysis',
                title: 'Target Clustering',
                evidence: $cluster_evidence,
                implications: $cluster_implications,
                recommendations: $cluster_recommendations
            })
        """, {
            "cluster_evidence": json.dumps({
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
            }),
            "cluster_implications": json.dumps([
                "4 distinct mineralization centers identified",
                "Each target requires individual assessment",
                "Possible different geological controls"
            ]),
            "cluster_recommendations": json.dumps([
                "Create separate resource models per target",
                "Evaluate grade distribution per cluster",
                "Design target-specific drilling campaigns"
            ])
        })

    def _create_relationships(self):
        self.run_query("""
            // Match data nodes
            MATCH (ni:DataNode {id: 'assay.elements.Ni'})
            MATCH (si:DataNode {id: 'assay.elements.Si'})
            MATCH (mg:DataNode {id: 'assay.elements.Mg'})
            MATCH (lito:DataNode {id: 'lithology.LITO'})
            MATCH (z:DataNode {id: 'collar.z'})
            MATCH (dip:DataNode {id: 'survey.dip'})
            MATCH (x:DataNode {id: 'collar.x'})
            MATCH (y:DataNode {id: 'collar.y'})
            
            // Match inference nodes
            MATCH (ni_lat:Inference {id: 'ni_lateritico'})
            MATCH (underg:Inference {id: 'underground'})
            MATCH (capping:Inference {id: 'capping'})
            MATCH (var:Inference {id: 'variograma'})
            MATCH (krig:Inference {id: 'krigagem'})
            MATCH (trend:Inference {id: 'trend_vertical'})
            MATCH (area:Inference {id: 'area_analysis'})
            MATCH (cluster:Inference {id: 'cluster_analysis'})
            
            // Create SUPPORTS relationships
            MERGE (ni)-[:SUPPORTS]->(ni_lat)
            MERGE (si)-[:SUPPORTS]->(ni_lat)
            MERGE (mg)-[:SUPPORTS]->(ni_lat)
            MERGE (lito)-[:SUPPORTS]->(ni_lat)
            MERGE (z)-[:SUPPORTS]->(underg)
            MERGE (dip)-[:SUPPORTS]->(underg)
            MERGE (ni)-[:SUPPORTS]->(capping)
            MERGE (x)-[:SUPPORTS]->(area)
            MERGE (y)-[:SUPPORTS]->(area)
            MERGE (ni)-[:SUPPORTS]->(cluster)
            
            // Create LEADS_TO relationships
            MERGE (ni_lat)-[:LEADS_TO]->(var)
            MERGE (var)-[:LEADS_TO]->(krig)
            MERGE (ni_lat)-[:LEADS_TO]->(trend)
            MERGE (area)-[:LEADS_TO]->(cluster)
        """)
    
    def down(self):
        # Remove all inference nodes
        self.run_query("""
            MATCH (n:Inference)
            DETACH DELETE n
        """)
