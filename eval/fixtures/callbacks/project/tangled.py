def collect(count, subscribe, emit):
    values = {}
    cancels = []
    registering = True
    done = False

    def finish():
        nonlocal done
        if done or registering or len(values) != count:
            return
        done = True
        emit([values[i] for i in range(count)])
        for cancel in cancels:
            cancel()

    def observe(index):
        def on_value(value):
            if done or index in values:
                return
            values[index] = value
            finish()
        return on_value

    for index in range(count):
        cancels.append(subscribe(index, observe(index)))
    registering = False
    finish()
