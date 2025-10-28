from .base_migration import BaseMigration
import json
import random

class KnowledgeWebMigration(BaseMigration):
    @property
    def version(self) -> str:
        return "004"
    
    @property
    def description(self) -> str:
        return "Expanded knowledge web with ~100 mock geological inferences"
    
    # ========== MOCK KNOWLEDGE NODES ==========
    # Organized by category for visual clarity
    
    MOCK_NODES = [
        # === GEOLOGICAL INTERPRETATION (20 nodes) ===
        {"id": "contact_sap_lat", "title": "Contact SAP/LAT Boundary", "type": "interpretation", "sources": ["lithology.LITO"]},
        {"id": "contact_lat_fresh", "title": "Contact LAT/Fresh Rock", "type": "interpretation", "sources": ["lithology.LITO"]},
        {"id": "oxidation_depth", "title": "Oxidation Depth Analysis", "type": "interpretation", "sources": ["lithology.LITO", "collar.z"]},
        {"id": "weathering_intensity", "title": "Weathering Intensity Index", "type": "interpretation", "sources": ["lithology.LITO", "assay.elements.Si"]},
        {"id": "structural_control", "title": "Structural Control on Mineralization", "type": "interpretation", "sources": ["lithology.LITO", "survey.dip"]},
        {"id": "domain_saprolite", "title": "Saprolite Domain Definition", "type": "interpretation", "sources": ["lithology.LITO", "ni_lateritico"]},
        {"id": "domain_laterite", "title": "Laterite Domain Definition", "type": "interpretation", "sources": ["lithology.LITO", "ni_lateritico"]},
        {"id": "domain_transition", "title": "Transition Zone Domain", "type": "interpretation", "sources": ["contact_sap_lat", "contact_lat_fresh"]},
        {"id": "mineralization_style", "title": "Mineralization Style Classification", "type": "interpretation", "sources": ["ni_lateritico", "assay.elements.Ni"]},
        {"id": "enrichment_zone", "title": "Enrichment Zone Identification", "type": "interpretation", "sources": ["assay.elements.Ni", "oxidation_depth"]},
        {"id": "depletion_zone", "title": "Depletion Zone Mapping", "type": "interpretation", "sources": ["assay.elements.Ni", "weathering_intensity"]},
        {"id": "grade_shell_05", "title": "Grade Shell 0.5% Ni", "type": "interpretation", "sources": ["assay.elements.Ni", "domain_saprolite"]},
        {"id": "grade_shell_10", "title": "Grade Shell 1.0% Ni", "type": "interpretation", "sources": ["assay.elements.Ni", "domain_laterite"]},
        {"id": "thickness_analysis", "title": "Mineralized Thickness Analysis", "type": "interpretation", "sources": ["enrichment_zone", "collar.depth"]},
        {"id": "continuity_assessment", "title": "Grade Continuity Assessment", "type": "interpretation", "sources": ["assay.elements.Ni", "data_spacing_sufficiency"]},
        {"id": "dike_mapping", "title": "Barren Dike Mapping", "type": "interpretation", "sources": ["lithology.LITO", "assay.elements.Mg"]},
        {"id": "fault_interpretation", "title": "Fault Offset Analysis", "type": "interpretation", "sources": ["structural_control", "survey.dip"]},
        {"id": "folding_analysis", "title": "Folding Impact on Grades", "type": "interpretation", "sources": ["structural_control", "assay.elements.Ni"]},
        {"id": "alteration_mapping", "title": "Alteration Mineral Mapping", "type": "interpretation", "sources": ["assay.elements.Si", "assay.elements.Mg"]},
        {"id": "geochemical_vectors", "title": "Geochemical Vectors to Ore", "type": "interpretation", "sources": ["assay.elements.Ni", "assay.elements.Si"]},
        
        # === STATISTICAL ANALYSIS (20 nodes) ===
        {"id": "composite_1m", "title": "1m Composite Generation", "type": "action", "sources": ["assay.elements.Ni", "code_composite"]},
        {"id": "composite_validation", "title": "Composite vs Raw Assay Check", "type": "action", "sources": ["composite_1m", "assay.elements.Ni"]},
        {"id": "stats_by_domain", "title": "Statistics by Domain", "type": "action", "sources": ["composite_1m", "domain_saprolite", "domain_laterite"]},
        {"id": "histogram_ni", "title": "Ni Histogram Analysis", "type": "interpretation", "sources": ["stats_by_domain"]},
        {"id": "probability_plot", "title": "Probability Plot (Lognormal Test)", "type": "interpretation", "sources": ["stats_by_domain"]},
        {"id": "outlier_detection", "title": "Outlier Detection (3σ rule)", "type": "interpretation", "sources": ["stats_by_domain", "capping"]},
        {"id": "cv_by_domain", "title": "CV Analysis per Domain", "type": "interpretation", "sources": ["stats_by_domain"]},
        {"id": "metal_balance_raw", "title": "Metal Balance: Raw Assays", "type": "action", "sources": ["assay.elements.Ni"]},
        {"id": "metal_balance_comp", "title": "Metal Balance: Composites", "type": "action", "sources": ["composite_1m", "metal_balance_raw"]},
        {"id": "correlation_ni_si", "title": "Correlation Ni vs Si", "type": "interpretation", "sources": ["assay.elements.Ni", "assay.elements.Si"]},
        {"id": "correlation_ni_mg", "title": "Correlation Ni vs Mg", "type": "interpretation", "sources": ["assay.elements.Ni", "assay.elements.Mg"]},
        {"id": "density_vs_grade", "title": "Density vs Grade Correlation", "type": "interpretation", "sources": ["assay.elements.Ni"]},
        {"id": "grade_thickness", "title": "Grade-Thickness Product", "type": "interpretation", "sources": ["assay.elements.Ni", "thickness_analysis"]},
        {"id": "percentile_analysis", "title": "Percentile Analysis (P10-P90)", "type": "interpretation", "sources": ["stats_by_domain"]},
        {"id": "population_split", "title": "Population Splitting Test", "type": "interpretation", "sources": ["histogram_ni", "probability_plot"]},
        {"id": "boundary_grade", "title": "Domain Boundary Grade Test", "type": "interpretation", "sources": ["domain_saprolite", "domain_laterite"]},
        {"id": "spatial_clustering", "title": "Spatial Grade Clustering", "type": "interpretation", "sources": ["cluster_analysis", "assay.elements.Ni"]},
        {"id": "decluster_weights", "title": "Declustering Weights (Cell)", "type": "action", "sources": ["spatial_clustering", "data_spacing_sufficiency"]},
        {"id": "qq_plot_domains", "title": "QQ Plot: Domain Comparison", "type": "interpretation", "sources": ["domain_saprolite", "domain_laterite"]},
        {"id": "cap_value_selection", "title": "Cap Value Selection (99th P)", "type": "action", "sources": ["outlier_detection", "capping"]},
        
        # === VARIOGRAPHY & CONTINUITY (15 nodes) ===
        {"id": "downhole_variogram", "title": "Downhole Variogram", "type": "action", "sources": ["composite_1m", "variography"]},
        {"id": "directional_variogram", "title": "Directional Variogram (N-S-EW)", "type": "action", "sources": ["composite_1m", "variography"]},
        {"id": "variogram_modeling", "title": "Variogram Model Fitting", "type": "action", "sources": ["directional_variogram", "variograma"]},
        {"id": "anisotropy_ratio", "title": "Anisotropy Ratio Calculation", "type": "interpretation", "sources": ["variogram_modeling", "variograma"]},
        {"id": "anisotropy_orientation", "title": "Anisotropy Orientation (Dip/Azimuth)", "type": "interpretation", "sources": ["variogram_modeling", "structural_control"]},
        {"id": "nugget_effect", "title": "Nugget Effect Analysis", "type": "interpretation", "sources": ["variogram_modeling"]},
        {"id": "sill_validation", "title": "Sill vs Variance Check", "type": "interpretation", "sources": ["variogram_modeling", "stats_by_domain"]},
        {"id": "range_estimation", "title": "Range Estimation (Major/Minor)", "type": "interpretation", "sources": ["variogram_modeling"]},
        {"id": "cross_validation", "title": "Cross-Validation (Jackknife)", "type": "action", "sources": ["variogram_modeling", "composite_1m"]},
        {"id": "variogram_map", "title": "Variogram Map (2D)", "type": "interpretation", "sources": ["directional_variogram"]},
        {"id": "nested_structures", "title": "Nested Structures Identification", "type": "interpretation", "sources": ["variogram_modeling"]},
        {"id": "geometric_anisotropy", "title": "Geometric Anisotropy Test", "type": "interpretation", "sources": ["anisotropy_ratio", "anisotropy_orientation"]},
        {"id": "zonal_anisotropy", "title": "Zonal Anisotropy Test", "type": "interpretation", "sources": ["variogram_modeling"]},
        {"id": "continuity_model", "title": "Spatial Continuity Model", "type": "action", "sources": ["variogram_modeling", "anisotropy_ratio"]},
        {"id": "variogram_by_domain", "title": "Variogram Modeling per Domain", "type": "action", "sources": ["domain_saprolite", "domain_laterite", "variography"]},
        
        # === ESTIMATION PARAMETERS (15 nodes) ===
        {"id": "parent_cell_size", "title": "Parent Cell Size Definition", "type": "action", "sources": ["data_spacing_sufficiency", "build_block_model"]},
        {"id": "subcell_size", "title": "Sub-cell Size (Contact Volumes)", "type": "action", "sources": ["parent_cell_size", "domain_saprolite"]},
        {"id": "search_ellipsoid", "title": "Search Ellipsoid Orientation", "type": "action", "sources": ["anisotropy_orientation", "search_neighbourhood"]},
        {"id": "search_range", "title": "Search Range Definition", "type": "action", "sources": ["range_estimation", "search_neighbourhood"]},
        {"id": "search_octants", "title": "Octant Search Strategy", "type": "action", "sources": ["search_ellipsoid", "parameter_optimisation"]},
        {"id": "min_samples", "title": "Minimum Samples per Block", "type": "action", "sources": ["cross_validation", "parameter_optimisation"]},
        {"id": "max_samples", "title": "Maximum Samples per Block", "type": "action", "sources": ["cross_validation", "parameter_optimisation"]},
        {"id": "samples_per_octant", "title": "Min/Max Samples per Octant", "type": "action", "sources": ["search_octants"]},
        {"id": "multiple_passes", "title": "Multi-pass Search Strategy", "type": "action", "sources": ["search_range", "parameter_optimisation"]},
        {"id": "kriging_type", "title": "Kriging Type Selection (OK/SK)", "type": "action", "sources": ["stats_by_domain", "estimation"]},
        {"id": "kriging_matrix", "title": "Kriging Matrix Validation", "type": "action", "sources": ["kriging_type", "variogram_modeling"]},
        {"id": "block_discretization", "title": "Block Discretization (4x4x4)", "type": "action", "sources": ["parent_cell_size"]},
        {"id": "search_strategy_test", "title": "Search Strategy Testing", "type": "interpretation", "sources": ["search_ellipsoid", "cross_validation"]},
        {"id": "kna_results", "title": "KNA Results Analysis", "type": "interpretation", "sources": ["parameter_optimisation", "cross_validation"]},
        {"id": "slope_of_regression", "title": "Slope of Regression Analysis", "type": "interpretation", "sources": ["cross_validation"]},
        
        # === VALIDATION & QC (15 nodes) ===
        {"id": "visual_validation", "title": "Visual Validation (Sections)", "type": "action", "sources": ["estimation", "validation"]},
        {"id": "swath_plots", "title": "Swath Plots (X-Y-Z)", "type": "action", "sources": ["estimation", "composite_1m", "validation"]},
        {"id": "grade_tonnage", "title": "Grade-Tonnage Curves", "type": "interpretation", "sources": ["estimation", "validation"]},
        {"id": "qq_plot_est", "title": "QQ Plot: Estimated vs Composite", "type": "interpretation", "sources": ["estimation", "composite_1m"]},
        {"id": "mean_comparison", "title": "Mean Grade Comparison", "type": "interpretation", "sources": ["estimation", "stats_by_domain"]},
        {"id": "variance_comparison", "title": "Variance Comparison", "type": "interpretation", "sources": ["estimation", "stats_by_domain"]},
        {"id": "drift_check", "title": "Drift Check (Kriging Mean)", "type": "interpretation", "sources": ["estimation"]},
        {"id": "nearest_neighbour", "title": "Nearest Neighbour Estimate", "type": "action", "sources": ["composite_1m", "validation"]},
        {"id": "nn_vs_ok", "title": "NN vs OK Comparison", "type": "interpretation", "sources": ["nearest_neighbour", "estimation"]},
        {"id": "inverse_distance", "title": "Inverse Distance (ID2) Estimate", "type": "action", "sources": ["composite_1m", "validation"]},
        {"id": "id_vs_ok", "title": "ID2 vs OK Comparison", "type": "interpretation", "sources": ["inverse_distance", "estimation"]},
        {"id": "grade_profile", "title": "Grade Profile by Bench", "type": "interpretation", "sources": ["estimation", "collar.z"]},
        {"id": "metal_balance_final", "title": "Metal Balance: Model vs Composites", "type": "action", "sources": ["estimation", "metal_balance_comp"]},
        {"id": "variance_reduction", "title": "Variance Reduction Factor", "type": "interpretation", "sources": ["estimation", "stats_by_domain"]},
        {"id": "smoothing_effect", "title": "Smoothing Effect Analysis", "type": "interpretation", "sources": ["variance_reduction", "kriging_type"]},
        
        # === CLASSIFICATION & REPORTING (10 nodes) ===
        {"id": "kriging_variance", "title": "Kriging Variance Analysis", "type": "interpretation", "sources": ["estimation"]},
        {"id": "data_density", "title": "Data Density per Block", "type": "interpretation", "sources": ["estimation", "data_spacing_sufficiency"]},
        {"id": "geological_confidence", "title": "Geological Confidence Score", "type": "interpretation", "sources": ["domain_saprolite", "domain_laterite", "continuity_assessment"]},
        {"id": "measured_class", "title": "Measured Resource Classification", "type": "action", "sources": ["kriging_variance", "data_density", "classification"]},
        {"id": "indicated_class", "title": "Indicated Resource Classification", "type": "action", "sources": ["kriging_variance", "data_density", "classification"]},
        {"id": "inferred_class", "title": "Inferred Resource Classification", "type": "action", "sources": ["kriging_variance", "data_density", "classification"]},
        {"id": "economic_cutoff", "title": "Economic Cutoff Grade", "type": "action", "sources": ["grade_tonnage"]},
        {"id": "resource_tonnes", "title": "Resource Tonnes by Class", "type": "interpretation", "sources": ["measured_class", "indicated_class", "inferred_class", "density_modelling"]},
        {"id": "contained_metal", "title": "Contained Metal (Ni tonnes)", "type": "interpretation", "sources": ["resource_tonnes", "estimation"]},
        {"id": "jorc_table1", "title": "JORC Table 1 Documentation", "type": "action", "sources": ["classification", "validation", "estimation"]},
    ]
    
    def _create_mock_nodes(self, tx):
        """Create all mock knowledge nodes"""
        for node in self.MOCK_NODES:
            evidence_text = f"Analysis based on {', '.join(node['sources'])}"
            evidence_json = json.dumps({"input": evidence_text})
            implications_json = json.dumps(["Part of resource estimation workflow"])
            recommendations_json = json.dumps(["Review in context of project geology"])
            
            tx.run("""
                MERGE (i:Inference {id: $id})
                SET i.title = $title,
                    i.type = $type,
                    i.evidence = $evidence,
                    i.implications = $implications,
                    i.recommendations = $recommendations,
                    i.metadata = $metadata
            """, 
                id=node['id'],
                title=node['title'],
                type=node['type'],
                evidence=evidence_json,
                implications=implications_json,
                recommendations=recommendations_json,
                metadata=json.dumps({"mock_node": True, "category": "knowledge_web"})
            )
        
        print(f"✅ Created {len(self.MOCK_NODES)} mock knowledge nodes")
    
    def _create_mock_connections(self, tx):
        """Connect mock nodes to existing nodes and each other"""
        connection_count = 0
        
        for node in self.MOCK_NODES:
            for source_path in node['sources']:
                # Try to connect to DataNode first
                result = tx.run("""
                    OPTIONAL MATCH (source:DataNode {id: $source_path})
                    OPTIONAL MATCH (source_inf:Inference {id: $source_path})
                    WITH COALESCE(source, source_inf) as source_node
                    MATCH (target:Inference {id: $target_id})
                    WHERE source_node IS NOT NULL
                    MERGE (source_node)-[:SUPPORTS]->(target)
                    RETURN count(*) as created
                """, 
                    source_path=source_path,
                    target_id=node['id']
                )
                
                created = result.single()
                if created and created['created'] > 0:
                    connection_count += 1
        
        print(f"✅ Created {connection_count} connections for mock nodes")
    
    def up(self):
        """Apply migration"""
        with self.driver.session(database=self.database) as session:
            session.execute_write(self._create_mock_nodes)
            session.execute_write(self._create_mock_connections)
    
    def down(self):
        """Rollback migration"""
        with self.driver.session(database=self.database) as session:
            # Delete mock nodes and their relationships
            session.run("""
                MATCH (n:Inference)
                WHERE n.metadata CONTAINS '"mock_node": true'
                DETACH DELETE n
            """)
            print("✅ Deleted all mock knowledge nodes")

