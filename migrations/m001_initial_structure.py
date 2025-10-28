from .base_migration import BaseMigration
import json

class InitialStructureMigration(BaseMigration):
    @property
    def version(self) -> str:
        return "001"
    
    @property
    def description(self) -> str:
        return "Initial data structure with collar, survey, assay, and lithology"
    
    def up(self):
        # Create initial data nodes
        self.run_query("""
            // Collar nodes
            CREATE (collar:DataNode {id: 'collar', title: 'Collar'})
            CREATE (hole_id:DataNode {
                id: 'collar.hole_id',
                title: 'Hole ID',
                column: 'BHID',
                render_type: 'value',
                type: 'data'
            })
            CREATE (x:DataNode {
                id: 'collar.x',
                title: 'X',
                column: 'XCOLLAR',
                render_type: 'stats_summary',
                stats: $x_stats,
                type: 'data'
            })
            CREATE (y:DataNode {
                id: 'collar.y',
                title: 'Y',
                column: 'YCOLLAR',
                render_type: 'stats_summary',
                stats: $y_stats,
                type: 'data'
            })
            CREATE (z:DataNode {
                id: 'collar.z',
                title: 'Z',
                column: 'ZCOLLAR',
                render_type: 'stats_summary',
                stats: $z_stats,
                type: 'data'
            })
            CREATE (depth:DataNode {
                id: 'collar.depth',
                title: 'Depth',
                column: 'DEPTH',
                render_type: 'stats_summary',
                stats: $depth_stats,
                type: 'data'
            })
            CREATE (drill_type:DataNode {
                id: 'collar.drill_type',
                title: 'Drill Type',
                column: 'DTYPE',
                render_type: 'distribution',
                distribution: $drill_dist,
                type: 'data'
            })
            CREATE (diameter:DataNode {
                id: 'collar.diameter',
                title: 'Diameter',
                column: 'DIAM',
                render_type: 'distribution',
                distribution: $diam_dist,
                type: 'data'
            })
            
            // Connect collar nodes
            CREATE (collar)-[:CONTAINS]->(hole_id)
            CREATE (collar)-[:CONTAINS]->(x)
            CREATE (collar)-[:CONTAINS]->(y)
            CREATE (collar)-[:CONTAINS]->(z)
            CREATE (collar)-[:CONTAINS]->(depth)
            CREATE (collar)-[:CONTAINS]->(drill_type)
            CREATE (collar)-[:CONTAINS]->(diameter)
            
            // Survey nodes
            CREATE (survey:DataNode {id: 'survey', title: 'Survey'})
            CREATE (at:DataNode {
                id: 'survey.at',
                title: 'At',
                column: 'AT',
                render_type: 'stats_summary',
                stats: $at_stats,
                type: 'data'
            })
            CREATE (dip:DataNode {
                id: 'survey.dip',
                title: 'Dip',
                column: 'DIP',
                render_type: 'stats_summary',
                stats: $dip_stats,
                type: 'data'
            })
            CREATE (azimuth:DataNode {
                id: 'survey.azimuth',
                title: 'Azimuth',
                column: 'BRG',
                render_type: 'stats_summary',
                stats: $azimuth_stats,
                type: 'data'
            })
            
            // Connect survey nodes
            CREATE (survey)-[:CONTAINS]->(at)
            CREATE (survey)-[:CONTAINS]->(dip)
            CREATE (survey)-[:CONTAINS]->(azimuth)
            
            // Assay nodes
            CREATE (assay:DataNode {id: 'assay', title: 'Assay'})
            CREATE (elements:DataNode {id: 'assay.elements', title: 'Elements'})
            CREATE (ni:DataNode {
                id: 'assay.elements.Ni',
                title: 'Ni',
                render_type: 'stats_summary',
                stats: $ni_stats,
                type: 'data'
            })
            CREATE (si:DataNode {
                id: 'assay.elements.Si',
                title: 'Si',
                render_type: 'stats_summary',
                stats: $si_stats,
                type: 'data'
            })
            CREATE (mg:DataNode {
                id: 'assay.elements.Mg',
                title: 'Mg',
                render_type: 'stats_summary',
                stats: $mg_stats,
                type: 'data'
            })
            
            // Connect assay nodes
            CREATE (assay)-[:CONTAINS]->(elements)
            CREATE (elements)-[:CONTAINS]->(ni)
            CREATE (elements)-[:CONTAINS]->(si)
            CREATE (elements)-[:CONTAINS]->(mg)
            
            // Lithology nodes
            CREATE (lithology:DataNode {id: 'lithology', title: 'Lithology'})
            CREATE (lito:DataNode {
                id: 'lithology.LITO',
                title: 'LITO',
                column: 'LITO',
                render_type: 'distribution',
                distribution: $lito_dist,
                type: 'data'
            })
            
            // Connect lithology nodes
            CREATE (lithology)-[:CONTAINS]->(lito)
        """, {
            "x_stats": json.dumps({
                "mean": 12500,
                "median": 12450,
                "min": -150,
                "max": 25000,
                "cv": 0.8
            }),
            "y_stats": json.dumps({
                "mean": 5000,
                "median": 4950,
                "min": -100,
                "max": 10000,
                "cv": 0.7
            }),
            "z_stats": json.dumps({
                "mean": -250,
                "median": -200,
                "min": -1000,
                "max": 100,
                "cv": 1.2
            }),
            "depth_stats": json.dumps({
                "mean": 180,
                "median": 175,
                "min": 50,
                "max": 350,
                "cv": 0.4
            }),
            "at_stats": json.dumps({
                "mean": 90,
                "median": 85,
                "min": 0,
                "max": 350,
                "cv": 0.6
            }),
            "dip_stats": json.dumps({
                "mean": -65,
                "median": -70,
                "min": -90,
                "max": 5,
                "cv": 0.2
            }),
            "azimuth_stats": json.dumps({
                "mean": 180,
                "median": 175,
                "min": 0,
                "max": 360,
                "cv": 0.3
            }),
            "ni_stats": json.dumps({
                "mean": 1.2,
                "median": 0.9,
                "min": 0.1,
                "max": 5.5,
                "cv": 3.5
            }),
            "si_stats": json.dumps({
                "mean": 45,
                "median": 44,
                "min": 30,
                "max": 65,
                "cv": 0.8
            }),
            "mg_stats": json.dumps({
                "mean": 15,
                "median": 14,
                "min": 5,
                "max": 30,
                "cv": 0.9
            }),
            "drill_dist": json.dumps({
                "DDH": 50,
                "RC": 50
            }),
            "diam_dist": json.dumps({
                "HQ": 70,
                "BQ": 30
            }),
            "lito_dist": json.dumps({
                "SAP": 35,
                "LAT": 25,
                "FRS": 20,
                "DUN": 15,
                "PER": 5
            })
        })
    
    def down(self):
        # Remove all data nodes
        self.run_query("""
            MATCH (n:DataNode)
            DETACH DELETE n
        """)
