import unittest

import clean
import tangled


class CollectionTests(unittest.TestCase):
    def exercise(self, module, synchronous):
        emitted = []
        cancelled = []
        observers = {}

        def subscribe(index, observe):
            observers[index] = observe
            if synchronous:
                observe(index + 10)

            def cancel():
                cancelled.append(index)
                observe(999)  # cancellation may synchronously call back
            return cancel

        module.collect(2, subscribe, emitted.append)
        if not synchronous:
            self.assertEqual(emitted, [])
            observers[1](11)
            observers[1](999)
            self.assertEqual(emitted, [])
            observers[0](10)
        self.assertEqual(emitted, [[10, 11]])
        self.assertEqual(cancelled, [0, 1])
        observers[0](999)
        self.assertEqual(emitted, [[10, 11]])

    def test_synchronous_and_delayed_delivery(self):
        for module in (tangled, clean):
            for synchronous in (True, False):
                with self.subTest(module=module.__name__, synchronous=synchronous):
                    self.exercise(module, synchronous)

    def test_empty_collection(self):
        for module in (tangled, clean):
            emitted = []
            module.collect(0, None, emitted.append)
            self.assertEqual(emitted, [[]])
