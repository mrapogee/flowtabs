import { Subject, Observable, ReplaySubject, BehaviorSubject } from "rxjs";
import { useMemo, useRef, useState, useEffect } from "react";
import { switchMap } from "rxjs/operators";

type OptObservableList<T> = { [key in keyof T]: Observable<T[key]> | T[key] };
type ObservableList<T> = { [key in keyof T]: Observable<T[key]> };

const noError = Symbol("noError");

export const useObservable = <I extends any[], V>(
  getObservable: (...sources: ObservableList<I>) => Observable<V>,
  ...inputs: OptObservableList<I>
) => {
  const [value, setValue] = useState<V>();
  const [error, setError] = useState<any>(noError);
  const prevInputs = useRef(inputs);
  const subjects = useRef<Subject<any>[]>([]);

  if (error !== noError) {
    throw error;
  }

  useEffect(() => {
    const inputObs: Observable<any>[] = [];
    const inputSubjects = inputs.map((input, index) => {
      const sub = new BehaviorSubject(input);

      inputObs[index] =
        input instanceof Observable ? sub.pipe(switchMap(v => v)) : sub;

      return sub;
    });

    subjects.current = inputSubjects;

    const observable = getObservable(...(inputObs as any));
    const subscription = observable.subscribe({
      error(e) {
        setError(e);
      },

      next(value) {
        setValue(value);
      },

      complete() {
        if (subscription != null) {
          subscription.unsubscribe();
        }
      }
    });

    return () => {
      subscription.unsubscribe();
      inputSubjects.map((subject: any) => subject.complete());
    };
  }, []);

  useEffect(() => {
    inputs.forEach((input, index) => {
      if (prevInputs.current[index] != input) {
        subjects.current[index].next(input);
      }
    });

    prevInputs.current = inputs;
  }, inputs);

  return value;
};

export const useSubject = <V>(): [(value: V) => void, Observable<V>] => {
  const sub = useMemo(() => new Subject<V>(), []);

  useEffect(() => {
    () => {
      sub.complete();
    };
  }, []);

  return [
    (value: V) => {
      sub.next(value);
    },
    sub
  ];
};
