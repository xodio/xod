export class PinType {
  static Input = 0;
  static Output = 1;
} 

export class PinModel {
  constructor(public id: number, public nodeId: number, public position: number, public label: string, public type: PinType) {
  }
}
