import './App.css';
import {useEffect} from "react";
import {BpmnPaint} from "./bpmnPaintModule";


function App() {

    useEffect(() => {

        const painter = new BpmnPaint('#canvasBpmn');
        document.addEventListener('onInitBpmnPainter', () => {
            painter.drawDiagram([
                {   groupName: 'firstGroup',
                    groupId: 'group_1',
                    elements: [{
                        id: 'block_1',
                        name: 'ruleOrder',
                        value: 'NULL',
                        position: {
                            i: 6,
                            j: 3
                        },
                    },
                        {
                            id: 'block_2',
                            name: 'processVariable',
                            value: 'DormantScoreLTCutOff',
                            position: {
                                i: 7,
                                j: 3
                            },
                            connection: 'block_1'
                        },
                        {
                            id: 'block_3',
                            name: 'operation',
                            value: 'EQUALS',
                            position: {
                                i: 8,
                                j: 3
                            },
                            connection: 'block_2'
                        },
                        {
                            id: 'block_4',
                            name: 'expectedValue',
                            value: 'true',
                            position: {
                                i: 9,
                                j: 3
                            },
                            connection: 'block_3'
                        }]
                },
                {
                    groupName: 'firstGroup',
                    groupId: 'group_2',
                  //  connection: 'group_1',
                    elements: [
                        {
                            id: 'block_22',
                            name: 'processVariable',
                            value: 'TASK_STATUS',
                            position: {
                                i: 3,
                                j: 8
                            },
                        },
                        {
                            id: 'block_23',
                            name: 'operation',
                            value: '=',
                            position: {
                                i: 4,
                                j: 8
                            },
                            connection: 'block_22',
                            connectionType: "bpmn:Association",
                        },
                        {
                            id: 'block_24',
                            name: 'expectedValue',
                            value: 'POSITIVE',
                            position: {
                                i: 5,
                                j: 8
                            },
                            connection: 'block_23',
                            connectionType: "bpmn:Association",
                        }]
                },
                {
                    groupName: 'firstGroup',
                    groupId: 'group_3',
                    elements: [
                        {
                            id: 'block_32',
                            name: 'processVariable',
                            value: 'TASK_STATUS',
                            position: {
                                i: 11,
                                j: 8
                            },
                        },
                        {
                            id: 'block_43',
                            name: 'operation',
                            value: '=',
                            position: {
                                i: 12,
                                j: 8
                            },
                        },
                        {
                            id: 'block_54',
                            name: 'expectedValue',
                            value: 'NEGATIVE',
                            position: {
                                i: 13,
                                j: 8
                            },
                        }]
                },
                {
                    inputElement: {
                        name: 'group_1',
                    },
                    ifTrueElement: {
                        name: 'group_2',
                        label: {
                            value: 'true',
                            position: {
                                x: 300,
                                y: 300
                            }
                        },
                        waypoints: {
                            1: {
                                i: 4,
                                j: 6
                            },
                            2: {
                                i: 4,
                                j: 7
                            }
                        }
                    },
                    ifFalseElement: {
                        name: 'group_3',
                        label: {
                            value: 'false',
                            position: {
                                x: 300,
                                y: 300
                            }
                        },
                        waypoints: {
                            1: {
                                i: 12,
                                j: 6
                            },
                            2: {
                                i: 12,
                                j: 7
                            }
                        }
                    },
                    position: {
                        i: 8,
                        j: 5
                    }
                },
                {
                    endEvent: {
                        position: {
                            i: 8,
                            j: 11
                        },
                        fromElements: [
                            {
                                elementId: 'group_2',
                                waypoints: []
                            },
                            {
                                elementId: 'group_3',
                                waypoints: []
                            }
                        ]
                    }
                }
            ]);
        });

    });

  return (
      <div id='canvasBpmn' className='.canvas'/>
  );
}

export default App;
