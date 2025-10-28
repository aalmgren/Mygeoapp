from .base_migration import BaseMigration
import json

class WorkflowPipelineMigration(BaseMigration):
    @property
    def version(self) -> str:
        return "003"
    
    @property
    def description(self) -> str:
        return "Standard resource estimation workflow pipeline (macro steps)"
    
    # ========== WORKFLOW MACRO STEPS ==========
    WORKFLOW_STEPS = [
        {
            "id": "geological_interpretation",
            "title": "Geological Interpretation",
            "type": "action",
            "sequence": 1,
            "evidence": {
                "input": "Lithology logging and structural data",
                "purpose": "Understand geological controls on mineralization"
            },
            "implications": [
                "Foundation for all subsequent steps",
                "Defines mineralization style and controls",
                "Critical for domain definition"
            ],
            "recommendations": [
                "Review drill logs and assays together",
                "Map lithological contacts in 3D",
                "Identify structural controls"
            ]
        },
        {
            "id": "code_composite",
            "title": "Code and Composite Data",
            "type": "action",
            "sequence": 2,
            "evidence": {
                "input": "Geological interpretation + raw assays",
                "purpose": "Regularize sample lengths and assign domains"
            },
            "implications": [
                "Creates consistent sample support",
                "Assigns domain codes to samples",
                "Reduces bias from variable sample lengths"
            ],
            "recommendations": [
                "Use 1m composites for most deposits",
                "Ensure composites respect domain boundaries",
                "Flag composites crossing contacts"
            ]
        },
        {
            "id": "statistical_analysis",
            "title": "Statistical Analysis and Domaining",
            "type": "action",
            "sequence": 3,
            "evidence": {
                "input": "Composited and coded data",
                "purpose": "Define estimation domains and characterize populations"
            },
            "implications": [
                "Identifies distinct grade populations",
                "Validates geological domains statistically",
                "Informs kriging strategy per domain"
            ],
            "recommendations": [
                "Generate histograms and probability plots per domain",
                "Test domain boundaries with statistical tests",
                "Document mean, CV, and range per domain"
            ]
        },
        {
            "id": "top_cutting",
            "title": "Top Cutting Strategies",
            "type": "action",
            "sequence": 4,
            "evidence": {
                "input": "Statistical analysis (CV, outliers)",
                "purpose": "Manage high-grade outliers to prevent estimation bias"
            },
            "implications": [
                "Reduces risk of local overestimation",
                "Required when CV > 1.5-2.0",
                "Must be justified and documented"
            ],
            "recommendations": [
                "Use probability plots to define caps",
                "Cap per domain, not globally",
                "Document impact on metal balance"
            ]
        },
        {
            "id": "variography",
            "title": "Variography",
            "type": "action",
            "sequence": 5,
            "evidence": {
                "input": "Capped composites per domain",
                "purpose": "Model spatial continuity and anisotropy"
            },
            "implications": [
                "Defines search ranges and orientation",
                "Critical for kriging weights",
                "Anisotropy impacts estimation strongly"
            ],
            "recommendations": [
                "Model variograms per domain",
                "Test for anisotropy in 3D",
                "Validate with cross-validation"
            ]
        },
        {
            "id": "parameter_optimisation",
            "title": "Parameter Optimisation",
            "type": "action",
            "sequence": 6,
            "evidence": {
                "input": "Variogram models",
                "purpose": "Define optimal kriging parameters"
            },
            "implications": [
                "Balances smoothing vs local variance",
                "Determines min/max samples per block",
                "Affects classification and confidence"
            ],
            "recommendations": [
                "Run kriging neighbourhood analysis",
                "Test multiple search strategies",
                "Document rationale for final parameters"
            ]
        },
        {
            "id": "build_block_model",
            "title": "Build Block Model",
            "type": "action",
            "sequence": 7,
            "evidence": {
                "input": "Optimised parameters + domain solids",
                "purpose": "Create 3D grid for estimation"
            },
            "implications": [
                "Block size affects estimation variance",
                "Sub-blocking improves volume accuracy",
                "Parent cell size should be ~1/3 drill spacing"
            ],
            "recommendations": [
                "Align block model with drillhole grid",
                "Use sub-blocking at domain contacts",
                "Code blocks by domain"
            ]
        },
        {
            "id": "search_neighbourhood",
            "title": "Define Search Neighbourhood",
            "type": "action",
            "sequence": 8,
            "evidence": {
                "input": "Variogram ranges + anisotropy",
                "purpose": "Define sample search ellipsoid"
            },
            "implications": [
                "Too small = many unestimated blocks",
                "Too large = oversmoothing",
                "Anisotropy must match variogram"
            ],
            "recommendations": [
                "Use 1.5x variogram range for first pass",
                "Orient search to match anisotropy",
                "Use multiple passes if needed"
            ]
        },
        {
            "id": "estimation",
            "title": "Estimation",
            "type": "action",
            "sequence": 9,
            "evidence": {
                "input": "Block model + search + variogram",
                "purpose": "Estimate grades into block model"
            },
            "implications": [
                "Core of resource estimation",
                "Ordinary kriging is industry standard",
                "Kriging variance used for classification"
            ],
            "recommendations": [
                "Use ordinary kriging (OK) as baseline",
                "Store kriging variance",
                "Flag blocks with insufficient samples"
            ]
        },
        {
            "id": "density_modelling",
            "title": "Density Modelling",
            "type": "action",
            "sequence": 10,
            "evidence": {
                "input": "Grade estimates + density measurements",
                "purpose": "Estimate density for tonnage calculation"
            },
            "implications": [
                "Density errors = tonnage errors",
                "May correlate with grade",
                "Critical for metal balance"
            ],
            "recommendations": [
                "Measure density systematically",
                "Model density vs grade if correlated",
                "Validate with bulk samples"
            ]
        },
        {
            "id": "validation",
            "title": "Validation",
            "type": "action",
            "sequence": 11,
            "evidence": {
                "input": "Estimated model + input data",
                "purpose": "Verify estimation quality and reconcile"
            },
            "implications": [
                "Identifies estimation problems",
                "Required for resource reporting",
                "Builds confidence in model"
            ],
            "recommendations": [
                "Visual validation (sections, swath plots)",
                "Statistical validation (QQ plots, grade-tonnage)",
                "Nearest neighbour comparison"
            ]
        },
        {
            "id": "classification",
            "title": "Classification and Reporting",
            "type": "action",
            "sequence": 12,
            "evidence": {
                "input": "Validated model + kriging variance",
                "purpose": "Classify resources per JORC/NI43-101 and report"
            },
            "implications": [
                "Final step before reporting",
                "Classification based on confidence",
                "Must meet regulatory standards"
            ],
            "recommendations": [
                "Use kriging variance, data spacing, and geological confidence",
                "Apply conditional simulation for uncertainty",
                "Prepare compliant resource statement"
            ]
        }
    ]
    
    # ========== CONNECTIONS ==========
    # Starting point: lithology → geological_interpretation
    # Then sequential through workflow
    
    def _create_workflow_nodes(self, tx):
        """Create all workflow step nodes"""
        for step in self.WORKFLOW_STEPS:
            evidence_json = json.dumps(step['evidence'])
            implications_json = json.dumps(step['implications'])
            recommendations_json = json.dumps(step['recommendations'])
            
            tx.run("""
                MERGE (w:Inference {id: $id})
                SET w.title = $title,
                    w.type = $type,
                    w.sequence = $sequence,
                    w.evidence = $evidence,
                    w.implications = $implications,
                    w.recommendations = $recommendations,
                    w.metadata = $metadata
            """, 
                id=step['id'],
                title=step['title'],
                type=step['type'],
                sequence=step['sequence'],
                evidence=evidence_json,
                implications=implications_json,
                recommendations=recommendations_json,
                metadata=json.dumps({"workflow_step": True})
            )
        
        print(f"✅ Created {len(self.WORKFLOW_STEPS)} workflow steps")
    
    def _create_workflow_connections(self, tx):
        """Connect workflow steps sequentially and to data sources"""
        
        # 1. Connect Lithology → Geological Interpretation
        tx.run("""
            MATCH (lito:DataNode {id: 'lithology.LITO'})
            MATCH (geo:Inference {id: 'geological_interpretation'})
            MERGE (lito)-[:SUPPORTS]->(geo)
        """)
        print("✅ Connected Lithology → Geological Interpretation")
        
        # 2. Connect workflow steps sequentially
        for i in range(len(self.WORKFLOW_STEPS) - 1):
            current = self.WORKFLOW_STEPS[i]
            next_step = self.WORKFLOW_STEPS[i + 1]
            
            tx.run("""
                MATCH (current:Inference {id: $current_id})
                MATCH (next:Inference {id: $next_id})
                MERGE (current)-[:LEADS_TO]->(next)
            """, 
                current_id=current['id'],
                next_id=next_step['id']
            )
            print(f"✅ Connected {current['title']} → {next_step['title']}")
    
    def up(self):
        """Apply migration"""
        with self.driver.session(database=self.database) as session:
            session.execute_write(self._create_workflow_nodes)
            session.execute_write(self._create_workflow_connections)
    
    def down(self):
        """Rollback migration"""
        with self.driver.session(database=self.database) as session:
            # Delete workflow nodes and their relationships
            session.run("""
                MATCH (w:Inference)
                WHERE w.metadata CONTAINS '"workflow_step": true'
                DETACH DELETE w
            """)
            print("✅ Deleted all workflow steps")

