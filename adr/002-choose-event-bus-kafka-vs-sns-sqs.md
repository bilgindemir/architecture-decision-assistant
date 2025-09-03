# Choose event bus: Kafka vs SNS/SQS

*Status*: Accepted  
*Date*: 2025-09-03  
*Decision Drivers*: throughput, ordering, operational-complexity, cost, compliance

## Context and Problem Statement
We need to enable fan-out of events to multiple downstream services (e.g., billing, audit, notifications).  
The solution must support HIPAA compliance, guaranteed encryption in transit, and a cost ceiling of €2k/month.  
Our engineering teams have limited operational capacity for managing clusters.

## Considered Options
- Apache Kafka (self-managed on Kubernetes or via MSK)  
- AWS SNS + SQS (managed services)  

## Decision Outcome
**Chosen option: AWS SNS + SQS**  
We selected AWS managed services due to reduced operational burden, integrated encryption, and predictable scaling within our cost limits.

### Rationale
- Operational simplicity: No need to manage Kafka clusters, brokers, or Zookeeper.  
- Compliance: Native HIPAA compliance in AWS with encryption at rest and in transit.  
- Cost: Within our €2k/month ceiling for expected message volume (~10M messages/month).  
- Trade-off: SNS+SQS does not provide strict message ordering across topics; mitigated by idempotent consumers and FIFO queues where needed.

### Positive Consequences
- Faster time-to-production since no ops overhead for cluster management.  
- Native integration with other AWS services (Lambda, CloudWatch).  
- Lower learning curve for teams already familiar with SQS.

### Negative Consequences
- Limited portability (vendor lock-in to AWS).  
- Event replay and advanced stream processing require workarounds.  
- Ordering guarantees weaker compared to Kafka.

## Pros and Cons of the Options

### Apache Kafka
- **+** High throughput, strong ordering, ecosystem (Streams, Connect).  
- **+** Portable across clouds/on-prem.  
- **−** Requires ops expertise (cluster scaling, upgrades, monitoring).  
- **−** Higher cost at our scale (compute + storage).  

### AWS SNS + SQS
- **+** Managed service, low ops burden.  
- **+** Easy integration with existing AWS stack.  
- **+** Meets compliance and encryption requirements out of the box.  
- **−** Vendor lock-in.  
- **−** Limited replay & ordering.  

## Links
- Related ADRs: [001-seed.md](001-seed.md)
- Diagram references (C4):
  - Container View: [`docs/c4/event-bus-container.puml`](../docs/c4/event-bus-container.puml)
  - Container View (DSL): [`docs/c4/event-bus-container.dsl`](../docs/c4/event-bus-container.dsl)
- Standards/viewpoints:
  - ISO/IEC/IEEE 42010: Development View (components & responsibilities)
  - C4: Container view for event bus and consumers

