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

// Инициализация главного класса
// containerSelector - css селектор контейнера, который будет содержать bpmnPaint
// modules - массив дополнений bpmn-js ( опционально )
// startEventName - имя стартового события
export function BpmnPaint(containerSelector, modules = [], startEventName = ''){

    this.bpmn = new BpmnModeller({
        container: containerSelector,
        additionalModules: [
            // Подключаем дополнительные модули представляющие собой отдельный фунционал
        ],
    });

    document.onInitEvent = new Event('onInitBpmnPainter');

    const self = this;

    this.bpmn.importXML(empty_xml.replace('START_EVENT_NAME', startEventName)).then(() => {
        self.elementFactory = this.bpmn.get('elementFactory');
        self.elementRegistry = this.bpmn.get('elementRegistry');
        self.bpmnFactory = this.bpmn.get('bpmnFactory');
        self.modeling = this.bpmn.get('modeling');
        self.eventBus = this.bpmn.get('eventBus');

        console.log(self.eventBus);

        const disabledEvents = [
            'element.hover',
            'element.click',
            'element.dblclick',
            'element.hover',
            'bendpoint.move.hover',
            'connect.hover',
            'global-connect.hover'
        ];

        for(const e in disabledEvents){
            self.eventBus.off(e);
        }

        self.process = this.elementRegistry.get('Process_1');
        self.startEvent = this.elementRegistry.get('StartEvent_1');
        self.container = document.querySelector(containerSelector);
        self.canvasWidth = this.container.offsetWidth;
        self.canvasHeight = this.container.offsetHeight;

        console.log(this.canvasWidth, this.canvasHeight);

        self.coordinateSystem = {
            stepX: 1400 / 12,
            stepY: 120
        }

        document.dispatchEvent(document.onInitEvent);
    });

    this.makeConnection = function(params){
        const currentConnection = this.modeling.createConnection(
            params.from,
            params.to,
            {
                type: params.type || 'bpmn:SequenceFlow',
                businessObject: this.bpmnFactory.create(params.type || 'bpmn:SequenceFlow', {
                    id: Math.random().toString(36).substr(0, 20),
                    name: params.label,
                }),
            },
            this.process
        );

        if(params.waypoints){
            const keys = Object.entries(params.waypoints);
            console.log(keys);
            keys.forEach(key => {
                console.log(key[1]);
                currentConnection.waypoints[parseInt(key[0])].x = key[1].x;
                currentConnection.waypoints[parseInt(key[0])].y = key[1].y;
            });
            this.modeling.updateProperties(currentConnection, {
                waypoints: currentConnection.waypoints
            })
        }
    }

    this.drawGroup = function(group){
        console.log(!group.elements);
        if(!group.elements){
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

    this.drawLabel = function(elem){
        const gatewayObject = this.elementFactory.createShape({
            type: 'bpmn:TextAnnotation',
        });

        const gatewayShape = this.modeling.createShape(gatewayObject, {
            x: elem.position.x || elem.position.i * this.coordinateSystem.stepX,
            y: elem.position.y || elem.position.j * this.coordinateSystem.stepY
        }, this.process);
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