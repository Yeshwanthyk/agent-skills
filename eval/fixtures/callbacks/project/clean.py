from functools import partial


class Collection:
    def __init__(self, count, emit):
        self.count = count
        self.emit = emit
        self.values = {}
        self.cancels = []
        self.done = False

    def start(self, subscribe):
        for index in range(self.count):
            self.cancels.append(subscribe(index, partial(self.receive, index)))
        self.finish()

    def receive(self, index, value):
        if self.done or index in self.values:
            return
        self.values[index] = value
        self.finish()

    def finish(self):
        handles_ready = len(self.cancels) == self.count
        if self.done or not handles_ready or len(self.values) != self.count:
            return
        self.done = True
        self.emit([self.values[i] for i in range(self.count)])
        for cancel in self.cancels:
            cancel()


def collect(count, subscribe, emit):
    Collection(count, emit).start(subscribe)
