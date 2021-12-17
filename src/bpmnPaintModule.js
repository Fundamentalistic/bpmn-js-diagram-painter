import BpmnModeller from "bpmn-js/lib/Modeler";

const empty_xml = `
<?xml version="1.0" encoding="UTF-8"?>
<bpmn2:definitions xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn" exporter="Camunda Modeler" exporterVersion="4.1.0" xsi:schemaLocation="http://www.omg.org/spec/BPMN/20100524/MODEL BPMN20.xsd">
  <bpmn2:process id="Process_1" isExecutable="false">
    <bpmn2:startEvent id="StartEvent_1" name="START_EVENT_NAME" />
  </bpmn2:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="182" y="82" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="168" y="125" width="64" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn2:definitions>
`;

class EventBusLogger {
    constructor(eventBus) {
        const fire = eventBus.fire.bind(eventBus);

        eventBus.fire = (type, data) => {
            console.log(type, data);

            fire(type, data);
        };
    }
}
EventBusLogger.$inject = ["eventBus"];

// Инициализация главного класса
// containerSelector - css селектор контейнера, который будет содержать bpmnPaint
// modules - массив дополнений bpmn-js ( опционально )
// startEventName - имя стартового события
export function BpmnPaint(containerSelector, modules = [], startEventName = ''){

    this.bpmn = new BpmnModeller({
        container: containerSelector,
        additionalModules: [
            // {
            //     __init__: ["eventBusLogger"],
            //     eventBusLogger: ["type", EventBusLogger]
            // }
        ]
    });

    document.onInitEvent = new Event('onInitBpmnPainter');

    const self = this;

    this.bpmn.importXML(empty_xml.replace('START_EVENT_NAME', startEventName)).then(() => {
        self.elementFactory = this.bpmn.get('elementFactory');
        self.elementRegistry = this.bpmn.get('elementRegistry');
        self.bpmnFactory = this.bpmn.get('bpmnFactory');
        self.modeling = this.bpmn.get('modeling');
        self.eventBus = this.bpmn.get('eventBus');

        self.eventBus.on([
            'commandStack.shape.move.postExecute',
            'commandStack.connection.layout.postExecute'
        ], function(e) {
            console.log("on move: %o", e);
        });

        console.log(self.eventBus);

        const disabledEvents = [
            'element.hover',
            'element.click',
            'element.dblclick',
            'element.hover',
            'bendpoint.move.hover',
            'connect.hover',
            'global-connect.hover',
            'element.marker.update'
        ];

        self.eventBus.off(disabledEvents);

        self.process = this.elementRegistry.get('Process_1');
        self.startEvent = this.elementRegistry.get('StartEvent_1');
        self.container = document.querySelector(containerSelector);
        self.canvasWidth = this.container.offsetWidth;
        self.canvasHeight = this.container.offsetHeight;

        self.coordinateSystem = {
            stepX: 1400 / 12,
            stepY: 120
        }

        document.dispatchEvent(document.onInitEvent);
    });

    this.makeConnection = function(params){
        console.log(params.label);
        let label;
        if(params.label){
            if(typeof params.label === 'string'){
                label = params.label;
            }
            if(typeof params.label === 'object'){
                label = params.label.value;
            }
        }
        const currentConnection = this.modeling.createConnection(
            params.from,
            params.to,
            {
                type: params.type || 'bpmn:SequenceFlow',
                businessObject: this.bpmnFactory.create(params.type || 'bpmn:SequenceFlow', {
                    id: Math.random().toString(36).substr(0, 20),
                    name: label,
                }),
            },
            this.process
        );

        if(params.waypoints){
            const keys = Object.entries(params.waypoints);
            keys.forEach(key => {
                console.log(key[1]);
                currentConnection.waypoints[parseInt(key[0])].x = key[1].i ? key[1].i * this.coordinateSystem.stepX : key[1].x;
                currentConnection.waypoints[parseInt(key[0])].y = key[1].j ? key[1].j * this.coordinateSystem.stepY : key[1].y;
            });
            this.modeling.updateProperties(currentConnection, {
                waypoints: currentConnection.waypoints
            });
            if(typeof params.label === 'object') {
                this.modeling.updateLabel(currentConnection, params.label.value, {
                    x: currentConnection.waypoints[1].x + 10,
                    y: currentConnection.waypoints[1].y + 10,
                    width: 100,
                    height: 100
                });
            }
        }
    }

    this.drawGroup = function(group){
        console.log(!group.elements);
        if(!group.elements){
            // eslint-disable-next-line no-throw-literal
            throw 'Для группы необходимо инициализировать поле elements';
        }

        let minI, minJ, maxI, maxJ;
        group.elements.forEach(el => {
            if(!minI){
                minI = el.position.i; minJ = el.position.j;
                maxI = el.position.i; maxJ = el.position.j;
            }else{
                if(el.position.i < minI){
                    minI = el.position.i;
                }
                if(el.position.j < minJ){
                    minJ = el.position.j;
                }
                if(el.position.i > maxI){
                    maxI = el.position.i;
                }
                if(el.position.j > maxJ){
                    maxJ = el.position.j;
                }
            }
        });

        const groupBpmnObject = this.bpmnFactory.create('bpmn:Group', {
            id: group.groupId,
            name: group.groupName
        });

        const groupObject = this.elementFactory.createShape({
            type: 'bpmn:Group',
            name: group.groupName,
            businessObject: groupBpmnObject,
        });

        this.modeling.createShape(groupObject, {
            x: (minI-1) * this.coordinateSystem.stepX,
            y: (minJ-1) * this.coordinateSystem.stepY,
            width: ((maxI+1) - (minI-1)) * this.coordinateSystem.stepX,
            height: ((maxJ+1) - (minJ-1)) * this.coordinateSystem.stepY,
        }, this.process);

        if(group.connection){
            if(typeof group.connection === 'string'){
                this.makeConnection({
                        from: this.elementRegistry.get(group.connection),
                        to: groupObject,
                    }
                );
            }
            if(typeof group.connection === 'object'){
                this.makeConnection(group.connection);
            }
        }

        group.elements.forEach(element => {

            const businessObject = this.bpmnFactory.create('bpmn:Task', {
                id: element.id,
                name: element.value
            });

            const elementShape = this.elementFactory.createShape({
                type: 'bpmn:Task',
                name: element.name,
                businessObject: businessObject
            });

            this.modeling.createShape(elementShape, {
                x: element.position.i * this.coordinateSystem.stepX,
                y: element.position.j * this.coordinateSystem.stepY
            }, this.process);

            if(element.connection){
                this.modeling.createConnection(
                    this.elementRegistry.get(element.connection),
                    elementShape,
                    {type: element.connectionType || 'bpmn:SequenceFlow'},
                    this.process
                );
            }

        });

    }

    this.drawConditionElement = function(elem) {
        const gatewayObject = this.elementFactory.createShape({
            type: 'bpmn:Gateway',
        });

        const gatewayShape = this.modeling.createShape(gatewayObject, {
            x: elem.position.i ? elem.position.i * this.coordinateSystem.stepX : elem.position.x,
            y: elem.position.j ? elem.position.j * this.coordinateSystem.stepY : elem.position.y
        }, this.process);

        this.makeConnection({
            from: this.elementRegistry.get(elem.inputElement.name),
            to: gatewayShape,
            waypoints: elem.inputElement.waypoints
        });

        this.makeConnection({
            from: gatewayShape,
            to: this.elementRegistry.get(elem.ifTrueElement.name),
            label: elem.ifTrueElement.label,
            waypoints: elem.ifTrueElement.waypoints
        });
        console.log(gatewayShape);

        this.makeConnection({
            from: gatewayShape,
            to: this.elementRegistry.get(elem.ifFalseElement.name),
            label: elem.ifFalseElement.label,
            waypoints: elem.ifFalseElement.waypoints
        });
    }

    this.drawLabel = function(e, elem){
        const gatewayObject = this.elementFactory.createLabel(e, elem.position);
        return gatewayObject;
        // const gatewayShape = this.modeling.createShape(gatewayObject, {
        //     x: elem.position.x || elem.position.i * this.coordinateSystem.stepX,
        //     y: elem.position.y || elem.position.j * this.coordinateSystem.stepY
        // }, this.process);
    }

    this.drawDiagram = function(diagramArray) {
        diagramArray.forEach(elem => {
            if(elem.groupName){
                this.drawGroup(elem);
            }
            if(elem.inputElement){
                this.drawConditionElement(elem);
            }
            if(elem.label){
                this.drawLabel(elem);
            }
        });

    }

}