class Collection:
    def __init__(self, count, emit):
        self.count = count
        self.emit = emit
        self.values = {}
        self.cancels = []
        self.registering = True
        self.done = False

    def receive(self, index, value):
        if self.done or index in self.values:
            return
        self.values[index] = value
        self.finish()

    def finish(self):
        if self.done or self.registering or len(self.values) != self.count:
            return
        self.done = True
        self.emit([self.values[i] for i in range(self.count)])
        for cancel in self.cancels:
            cancel()


def collect(count, subscribe, emit):
    from functools import partial

    owner = Collection(count, emit)
    for index in range(count):
        owner.cancels.append(subscribe(index, partial(owner.receive, index)))
    owner.registering = False
    owner.finish()
